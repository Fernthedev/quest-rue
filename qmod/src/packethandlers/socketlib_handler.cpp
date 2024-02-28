#include "packethandlers/socketlib_handler.hpp"

#include "MainThreadRunner.hpp"

using namespace SocketLib;

void SocketLibHandler::listen(const int port) {
    SocketHandler& socketHandler = SocketHandler::getCommonSocketHandler();

    serverSocket = socketHandler.createServerSocket(port);
    serverSocket->bindAndListen();
    LOG_INFO("Started server");

    ServerSocket& serverSocket = *this->serverSocket;
    
    serverSocket.connectCallback += {&SocketLibHandler::connectEvent, this};
    serverSocket.listenCallback += {&SocketLibHandler::listenOnEvents, this};
}

void SocketLibHandler::scheduleAsync(std::function<void()> &&f) {
  std::thread(std::move(f)).detach();
}

bool SocketLibHandler::hasConnection() {
    return !serverSocket->getClients().empty();
}

void SocketLibHandler::connectEvent(Channel& channel, bool connected) {
    LOG_INFO("Connected {} status: {}", channel.clientDescriptor, connected ? "connected" : "disconnected");
    if (!connected)
        channelIncomingQueue.erase(&channel);
    else
        channelIncomingQueue.try_emplace(&channel, 0);
}

void SocketLibHandler::listenOnEvents(
    Channel &client, SocketLib::ReadOnlyStreamQueue &incomingQueue) {
  // read the bytes
  // if no packet is being parsed, get the first 8 bytes
  // the first 8 bytes are the size frame, which dictate the size of the
  // incoming packet (excluding the frame) then continue reading bytes until the
  // expected size matches the current byte size if excess bytes, loop again



  auto &pendingPacket = channelIncomingQueue.at(&client);


  
  // start of a new packet
  if (!pendingPacket.isValid()) {
    // get the first 8 bytes, then cast to size_t
    size_t expectedLength = *reinterpret_cast<size_t const *>(incomingQueue.dequeueAsVec(sizeof(size_t)).data());

    expectedLength = ntohq(expectedLength);

    // LOG_INFO("Starting packet: is little endian {} {} flipped {} {}",
    // std::endian::native == std::endian::little, expectedLength,
    // ntohq(expectedLength), receivedBytes);

    pendingPacket = {expectedLength};
  }

  // dequeue amount
  if (pendingPacket.getCurrentLength() < pendingPacket.getExpectedLength()) {
    auto remainingLength = pendingPacket.getExpectedLength() - pendingPacket.getCurrentLength();
    auto subspanData = incomingQueue.dequeueAsVec(remainingLength);
    pendingPacket.insertBytes(subspanData);
  }

  if (pendingPacket.getCurrentLength() < pendingPacket.getExpectedLength()) {
    return;
  }

  auto packetBytes = std::move(pendingPacket.getData()); // avoid copying
  pendingPacket = IncomingPacket(); // reset
  

  PacketWrapper packet;
  packet.ParseFromArray(packetBytes.data(), packetBytes.size());
  scheduleFunction(
      [this, packet = std::move(packet)]() { onReceivePacket(packet); });
}

void SocketLibHandler::sendPacket(const PacketWrapper& packet) {
    packet.CheckInitialized();
    size_t size = packet.ByteSizeLong();
    // send size header
    // send message with that size
    Message message(sizeof(size_t) + size);
    auto networkSize = htonq(size); // convert to big endian

    //set size header
    *reinterpret_cast<size_t*>(message.data()) = networkSize;

    packet.SerializeToArray(message.data() + sizeof(size_t), size); // payload

    for (auto const& [id, client] : serverSocket->getClients()) {
        client->queueWrite(message);
        // LOG_INFO("Sending to {} bytes {} {}", id, size, finishedBytes);
    }
}