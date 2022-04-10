use std::default::Default;
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::option::Option;
use std::str::FromStr;

use anyhow::Context;
use bytes::{Bytes, BytesMut};
use futures::{SinkExt, StreamExt};
use std::sync::Arc;
use tokio::net::TcpStream;
use tokio::select;
use tokio::sync::RwLock;
use tokio_util::codec::Framed;
use tokio_util::codec::LengthDelimitedCodec;
use tokio_util::sync::CancellationToken;

pub struct Connection {
    frame: Framed<TcpStream, LengthDelimitedCodec>,
    cancellation_read_token: CancellationToken,
}

impl Connection {
    pub fn new(tcp_stream: TcpStream) -> Self {
        let frame = LengthDelimitedCodec::builder()
            .length_field_offset(0) // default value
            .length_field_type::<u64>()
            .length_adjustment(0) // default value
            .new_framed(tcp_stream);

        Self {
            frame,
            cancellation_read_token: CancellationToken::new(),
        }
    }
}

#[derive(Default)]
pub struct AppState {
    connection: Arc<RwLock<Option<Connection>>>,
}

impl AppState {
    pub async fn connect(&self, ip: String, port: u16) -> anyhow::Result<()> {
        let socket_address = SocketAddr::new(IpAddr::V4(Ipv4Addr::from_str(&ip)?), port);

        let tcp_stream = TcpStream::connect(socket_address)
            .await
            .with_context(|| format!("Unable to connect to {ip}:{port}"))?;

        let connection = Connection::new(tcp_stream);

        *self.connection.write().await = Some(connection);

        Ok(())
    }

    pub async fn disconnect(&self) -> anyhow::Result<()> {
        // if let Some(stream) = &mut *self
        //     .tcp_stream
        //     .lock()
        //     .expect("Unable to get lock tcp stream")
        // {
        //     stream.shutdown().await?;
        // }

        let mut guard = self.connection.write().await;
    
        if let Some(connection) = &*guard {
            connection.cancellation_read_token.cancel();
        }

        *guard = None;

        Ok(())
    }

    pub async fn write_and_flush(&self, bytes: Bytes) -> anyhow::Result<()> {
        let mut connection_guard = self.connection.write().await;

        let connection = (*connection_guard).as_mut().unwrap();

        connection.frame.send(bytes).await?;
        Ok(())
    }

    pub async fn queue(&self, bytes: Bytes) -> anyhow::Result<()> {
        let mut connection_guard = self.connection.write().await;

        let connection = (*connection_guard).as_mut().unwrap();

        connection.frame.feed(bytes).await?;
        Ok(())
    }

    pub async fn flush(&self) -> anyhow::Result<()> {
        let mut connection_guard = self.connection.write().await;

        let connection = (*connection_guard).as_mut().unwrap();

        connection.frame.flush().await?;

        Ok(())
    }

    pub async fn read(&self) -> anyhow::Result<Option<BytesMut>> {
        // TODO: Don't lock, use something else
        // let mut connection_guard = self
        //     .connection
        //     .lock()
        //     .expect("Unable to unlock mutex connection");
        // let connection = connection_guard.as_mut().unwrap();

        // why can't read return &mut? smh
        let mut connection_guard = self.connection.write().await;

        let connection = (*connection_guard).as_mut().unwrap();

        let token = connection.cancellation_read_token.clone();
        let future = connection.frame.next();
        // unsafe {
        //     Mutex::unlock(connection_guard);
        // }

        // let res = connection.frame.next();

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
