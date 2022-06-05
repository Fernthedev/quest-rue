use std::default::Default;
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::option::Option;
use std::str::FromStr;
use std::time::Duration;

use anyhow::bail;
use anyhow::Context;
use bytes::{Bytes, BytesMut};
use futures::lock::Mutex;
use futures::{SinkExt, StreamExt};
use log::debug;
use protobuf::Message;
use std::sync::Arc;
use tokio::net::tcp::{OwnedReadHalf, OwnedWriteHalf};
use tokio::net::TcpStream;
use tokio::sync::RwLock;
use tokio::{select, time};
use tokio_util::codec::LengthDelimitedCodec;
use tokio_util::codec::{FramedRead, FramedWrite};
use tokio_util::sync::CancellationToken;

use crate::protos::qrue::PacketWrapper;

type ArcOptRwLock<T> = Arc<Mutex<Option<T>>>;

#[derive(Default)]
struct Connection {
    // connection: Option<Connection>,
    read_frame: ArcOptRwLock<FramedRead<OwnedReadHalf, LengthDelimitedCodec>>,
    write_frame: ArcOptRwLock<FramedWrite<OwnedWriteHalf, LengthDelimitedCodec>>,
    cancellation_read_token: Arc<RwLock<CancellationToken>>,
    connected: Arc<RwLock<bool>>,
}

impl Connection {
    pub async fn new_connection(&self, tcp_stream: TcpStream) -> anyhow::Result<()> {
        let (read_stream, write_stream) = tcp_stream.into_split();

        let mut codec = LengthDelimitedCodec::builder();
        codec
            .length_field_offset(0) // default value
            .length_field_type::<u64>()
            .length_field_length(8)
            .big_endian() // Do not strip frame header
            .length_adjustment(0); // default value

        let read_frame = codec.new_read(read_stream);
        let write_frame = codec.new_write(write_stream);

        *self.read_frame.lock().await = Some(read_frame);
        *self.write_frame.lock().await = Some(write_frame);
        *self.cancellation_read_token.write().await = CancellationToken::new();
        *self.connected.write().await = true;

        Ok(())
    }

    pub async fn reset(&self) {
        self.cancellation_read_token.read().await.cancel();
        *self.read_frame.lock().await = None;
        *self.write_frame.lock().await = None;
        *self.connected.write().await = false;
    }
}

#[derive(Default)]
pub struct AppState {
    connection: Connection,
    _read_loop_lock: Mutex<()>,
}

impl AppState {
    pub async fn is_connected(&self) -> bool {
        *self.connection.connected.read().await
    }

    // TODO: Close all when unrecoverable error
    pub async fn read_thread_loop<F>(&self, on_packet_receive: F) -> anyhow::Result<()>
    where
        F: Fn(BytesMut),
    {
        if self._read_loop_lock.try_lock().is_none() {
            bail!("Already running thread loop!");
        }

        let _lock_guard = self._read_loop_lock.lock();
        let cancel_token = self.connection.cancellation_read_token.read().await.clone();

        loop {
            if cancel_token.is_cancelled() {
                return Ok(());
            }

            let result = self.read(&cancel_token).await;
            if let Err(e) = result {
                self.disconnect().await?;
                return Err(e);
            }

            if let Some(bytes) = result.unwrap() {
                debug!("Received {:?}\n", &bytes);
                on_packet_receive(bytes)
            }
        }
    }

    pub async fn connect(&self, ip: String, port: u16) -> anyhow::Result<()> {
        if self.is_connected().await {
            self.disconnect().await?;
        }

        let socket_address = SocketAddr::new(IpAddr::V4(Ipv4Addr::from_str(&ip)?), port);

        // TODO: Configure
        let tcp_stream = time::timeout(Duration::from_secs(5), TcpStream::connect(socket_address))
            .await
            .with_context(|| format!("Unable to connect to {ip}:{port}"))??;

        self.connection.new_connection(tcp_stream).await?;

        Ok(())
    }

    pub async fn disconnect(&self) -> anyhow::Result<()> {
        self.connection.reset().await;

        Ok(())
    }

    pub async fn write_packet_and_flush(
        &self,
        packet_wrapper: PacketWrapper,
    ) -> anyhow::Result<()> {
        assert!(
            packet_wrapper.Packet.is_some(),
            "PacketWrapper does not wrap packet!"
        );
        let bytes = Bytes::from(packet_wrapper.write_to_bytes()?);

        self.write_and_flush(bytes).await
    }

    pub async fn queue_packet(&self, packet_wrapper: PacketWrapper) -> anyhow::Result<()> {
        assert!(
            packet_wrapper.Packet.is_some(),
            "PacketWrapper does not wrap packet!"
        );
        let bytes = Bytes::from(packet_wrapper.write_to_bytes()?);

        self.queue(bytes).await
    }

    // TODO: Close all when unrecoverable error
    pub async fn write_and_flush(&self, bytes: Bytes) -> anyhow::Result<()> {
        let mut connection_guard = self.connection.write_frame.lock().await;

        debug!("Sending bytes {}", bytes.len());

        let connection = (*connection_guard)
            .as_mut()
            .context("Not connected, cannot run write_and_flush()")?;
        connection.send(bytes).await?;
        Ok(())
    }

    // TODO: Close all when unrecoverable error
    pub async fn queue(&self, bytes: Bytes) -> anyhow::Result<()> {
        let mut connection_guard = self.connection.write_frame.lock().await;

        let connection = (*connection_guard)
            .as_mut()
            .context("Not connected, cannot run queue()")?;

        connection.feed(bytes).await?;
        Ok(())
    }

    // TODO: Close all when unrecoverable error
    pub async fn flush(&self) -> anyhow::Result<()> {
        let mut connection_guard = self.connection.write_frame.lock().await;

        let connection = (*connection_guard)
            .as_mut()
            .context("Not connected, cannot run flush()")?;

        connection.flush().await?;

        Ok(())
    }

    pub async fn read(&self, token: &CancellationToken) -> anyhow::Result<Option<BytesMut>> {
        let mut connection_guard = self.connection.read_frame.lock().await;

        let connection = (*connection_guard)
            .as_mut()
            .context("Not connected, cannot run read()")?;

        let future = connection.next();

        select! {
            _ = token.cancelled() => {
                Ok(None)
            },
            result = future => {
                match result {
                    Some(o) => Ok(Some(o?)),
                    _ => Ok(None),
                }
            }
        }
    }
}
