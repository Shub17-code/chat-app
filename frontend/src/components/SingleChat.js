import React, { useEffect, useState } from "react";
import { ChatState } from "../Context/chatProvider";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  InputGroup,
  InputLeftElement,
  VStack,
  Image,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { ArrowBackIcon, ArrowUpIcon, AttachmentIcon, AddIcon, SearchIcon, CloseIcon, ViewIcon } from "@chakra-ui/icons";
import { getSender, getSenderFull } from "./../config/ChatLogics";
import ProfileModel from "./miscellaneous/ProfileModel";
import UpdateGroupChatModel from "./miscellaneous/UpdateGroupChatModel";
import axios from "axios";
import "./styles.css";
import ScrollableChat from "./ScrollableChat";
import Lottie from "react-lottie-player";
import animationData from "../animation/typing.json";
import io from "socket.io-client";

const ENDPOINT = process.env.REACT_APP_API_URL;
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain, settings }) => {
  const [message, setMessage] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [previewUrl, setPreviewUrl] = useState("");
  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchMessage = async () => {
    if (!selectedChat) return;
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      setLoading(true);
      const { data } = await axios.get(
        `${ENDPOINT}/api/message/${selectedChat._id}`,
        config
      );
      // console.log(message);

      setMessage(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured",
        description: "Failed to load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };
  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    socket.on("message received", (newMessageReceived) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageReceived.chat._id
      ) {
        if (!notification.includes(newMessageReceived)) {
          setNotification([newMessageReceived, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessage([...message, newMessageReceived]);
      }
    });
    socket.on("message edited received", (editedMessage) => {
      setMessage(prev => 
        prev.map(m => m._id === editedMessage._id ? editedMessage : m)
      );
    });
    socket.on("message forwarded received", (forwardedMessage) => {
      if (selectedChatCompare?._id === forwardedMessage.chat._id) {
        setMessage(prev => [...prev, forwardedMessage]);
      }
    });
    socket.on("message pinned received", (pinnedMessage) => {
      setMessage(prev => 
        prev.map(m => m._id === pinnedMessage._id ? pinnedMessage : m)
      );
    });
    socket.on("message read received", ({ messageId, readBy }) => {
      setMessage(prev =>
        prev.map(m => m._id === messageId ? { ...m, readBy } : m)
      );
    });

    return () => {
      socket.off("setup");
      socket.off("connected");
      socket.off("typing");
      socket.off("stop typing");
      socket.off("message received");
      socket.off("message edited received");
      socket.off("message forwarded received");
      socket.off("message pinned received");
      socket.off("message read received");
    };
  }, [selectedChat]);

  useEffect(() => {
    fetchMessage();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post(
          `${ENDPOINT}/api/message`,
          {
            content: newMessage,
            chatId: selectedChat._id,
          },
          config
        );
        // console.log(data);

        socket.emit("new message", data);
        setMessage([...message, data]);
      } catch (error) {
        toast({
          title: "Error Occured",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    let lastTypingTime = new Date().getTime();
    var timeLength = 3000; //3sec
    setTimeout(() => {
      var currTime = new Date().getTime();
      var timeDiff = currTime - lastTypingTime;

      if (timeDiff >= timeLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timeLength);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;
    console.log(messageId);

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      await axios.delete(`${ENDPOINT}/api/message/${messageId}`, config);
      setMessage(message.filter((m) => m._id !== messageId)); // Update the message list locally
      // window.location.reload();
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast({
        title: "Error Occurred",
        description: "Failed to delete the Message",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "video/mp4",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image, video, or document",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("chatId", selectedChat._id);

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(
        `${ENDPOINT}/api/message/upload`,
        formData,
        config
      );

      socket.emit("new message", data);
      setMessage([...message, data]);
      setSelectedFile(null);
      setFilePreview(null);
      setPreviewUrl("");
      setIsUploading(false);

      toast({
        title: "File uploaded successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      setIsUploading(false);
      toast({
        title: "Error Occurred!",
        description: "Failed to upload the file",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const results = message.filter(m => 
      m.content.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleEditMessage = async (message) => {
    const newContent = prompt("Edit message:", message.content);
    if (newContent && newContent !== message.content) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await axios.put(
          `${ENDPOINT}/api/message/${message._id}/edit`,
          { content: newContent },
          config
        );
        
        socket.emit("message edited", data);
        setMessage(prev => prev.map((m) => 
          m._id === message._id ? data : m
        ));
      } catch (error) {
        toast({
          title: "Error Occurred",
          description: "Failed to edit message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  const handleForwardMessage = async (message) => {
    const targetChatId = prompt("Enter target chat ID:");
    if (targetChatId) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await axios.post(
          `${ENDPOINT}/api/message/${message._id}/forward`,
          { targetChatId },
          config
        );
        
        socket.emit("message forwarded", data);
      } catch (error) {
        toast({
          title: "Error Occurred",
          description: "Failed to forward message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  const handlePinMessage = async (message) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `${ENDPOINT}/api/message/${message._id}/pin`,
        {},
        config
      );
      
      socket.emit("message pinned", data);
      setMessage(prev => prev.map((m) => 
        m._id === message._id ? data : m
      ));
    } catch (error) {
      toast({
        title: "Error Occurred",
        description: "Failed to pin message",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const markMessageAsRead = async (messageId) => {
    if (!settings.readReceipts) return; // Only mark as read if read receipts are enabled
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(
        `${ENDPOINT}/api/message/${messageId}/read`,
        {},
        config
      );
      
      socket.emit("message read", { messageId, readBy: data.readBy });
      setMessage(prev =>
        prev.map(m => m._id === messageId ? { ...m, readBy: data.readBy } : m)
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  useEffect(() => {
    if (selectedChat && settings.readReceipts) {
      message.forEach(msg => {
        if (msg.sender._id !== user._id && (!msg.readBy || !msg.readBy.some(r => r.user === user._id))) {
          markMessageAsRead(msg._id);
        }
      });
    }
  }, [message, selectedChat, settings.readReceipts]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessage();
    }
  }, [selectedChat, fetchAgain]);

  useEffect(() => {
    if (socket) {
      socket.emit("join chat", selectedChat._id);
    }
    return () => {
      if (socket) {
        socket.emit("leave chat", selectedChat?._id);
      }
    };
  }, [selectedChat, socket]);

  useEffect(() => {
    if (socket) {
      socket.on("typing", () => setIsTyping(true));
      socket.on("stop typing", () => setIsTyping(false));
      socket.on("message received", (newMessageReceived) => {
        if (
          !selectedChatCompare ||
          selectedChatCompare._id !== newMessageReceived.chat._id
        ) {
          if (!notification.includes(newMessageReceived)) {
            setNotification([newMessageReceived, ...notification]);
            setFetchAgain(!fetchAgain);
          }
        } else {
          setMessage([...message, newMessageReceived]);
        }
      });
      socket.on("message edited received", (editedMessage) => {
        setMessage((prev) =>
          prev.map((m) =>
            m._id === editedMessage._id ? editedMessage : m
          )
        );
      });
      socket.on("message forwarded received", (forwardedMessage) => {
        setMessage((prev) => [...prev, forwardedMessage]);
      });
      socket.on("message pinned received", (pinnedMessage) => {
        setMessage((prev) =>
          prev.map((m) =>
            m._id === pinnedMessage._id ? pinnedMessage : m
          )
        );
      });
      socket.on("message read received", (data) => {
        setMessage((prev) =>
          prev.map((m) =>
            m._id === data.messageId
              ? {
                  ...m,
                  readBy: [...(m.readBy || []), data.userId],
                }
              : m
          )
        );
      });
    }
    return () => {
      if (socket) {
        socket.off("typing");
        socket.off("stop typing");
        socket.off("message received");
        socket.off("message edited received");
        socket.off("message forwarded received");
        socket.off("message pinned received");
        socket.off("message read received");
      }
    };
  }, [socket, selectedChat, selectedChatCompare, notification, setNotification, fetchAgain, setFetchAgain, message, user]);

  return (
    <>
      {selectedChat ? (
        <>
          <Box
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {!selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModel
                  user={getSenderFull(user, selectedChat.users)}
                  children={
                    <IconButton
                      display={{ base: "flex", md: "none" }}
                      icon={<ViewIcon />}
                    />
                  }
                />
              </>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModel
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessage={fetchMessage}
                />
              </>
            )}
          </Box>
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner size="xl" w={20} h={20} alignSelf="center" margin="auto" />
            ) : (
              <div className="messages">
                <ScrollableChat
                  messages={isSearching ? searchResults : message}
                  handleDeleteMessage={handleDeleteMessage}
                  searchQuery={searchQuery}
                  onEditMessage={handleEditMessage}
                  onForwardMessage={handleForwardMessage}
                  settings={settings}
                />
              </div>
            )}

            <FormControl onKeyDown={sendMessage} isRequired mt={3}>
              {isTyping ? (
                <div>
                  <Lottie
                    loop
                    play={isTyping}
                    animationData={animationData}
                    style={{ width: 70, marginBottom: 15, marginLeft: 0 }}
                  />
                </div>
              ) : (
                <></>
              )}
              <Box display="flex" alignItems="center">
                <Input
                  variant="filled"
                  bg="#E0E0E0"
                  placeholder="Enter a message.."
                  onChange={typingHandler}
                  value={newMessage}
                  onKeyDown={sendMessage}
                />
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                  id="file-input"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                <label htmlFor="file-input">
                  <IconButton
                    as="span"
                    icon={<AttachmentIcon />}
                    colorScheme="teal"
                  />
                </label>
                <Button
                  variant="solid"
                  colorScheme="blue"
                  size="sm"
                  onClick={handleFileUpload}
                  ml={2}
                  isDisabled={!selectedFile}
                >
                  Upload
                </Button>
                <Button
                  variant="solid"
                  colorScheme="blue"
                  size="sm"
                  onClick={sendMessage}
                  ml={2}
                >
                  <ArrowUpIcon />
                </Button>
              </Box>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}

      {filePreview && (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>File Preview</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                {previewUrl.startsWith("data:image") ? (
                  <Image src={previewUrl} alt="Preview" maxH="500px" />
                ) : previewUrl.startsWith("data:video") ? (
                  <video src={previewUrl} controls style={{ width: "100%" }} />
                ) : (
                  <Button
                    as="a"
                    href={previewUrl}
                    target="_blank"
                    colorScheme="blue"
                  >
                    Download File
                  </Button>
                )}
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default SingleChat;
