use std::default::Default;
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::option::Option;
use std::str::FromStr;
use std::sync::Mutex;

use tokio::net::TcpStream;

#[derive(Default)]
pub struct AppState {
    tcp_stream: Mutex<Option<TcpStream>>,
}

impl AppState {
    pub async fn connect(&self, ip: String, port: u16) -> anyhow::Result<()> {
        let socket_address = SocketAddr::new(IpAddr::V4(Ipv4Addr::from_str(&ip)?), port);

        *self.tcp_stream.lock().expect("Unable to unlock tcp stream") =
            Some(TcpStream::connect(socket_address).await?);
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

        *self
            .tcp_stream
            .lock()
            .expect("Unable to get lock tcp stream") = None;

        Ok(())
    }
}
