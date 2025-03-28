import React, { useEffect, useState } from "react";
import { ChatState } from "../Context/chatProvider";
import { Box, Button, Stack, Text, useToast, useColorModeValue } from "@chakra-ui/react";
import axios from "axios";
import { AddIcon } from "@chakra-ui/icons";
import { getSender } from "../config/ChatLogics";
import GroupChatModel from "./miscellaneous/GroupChatModel";
import ChatLoading from "./ChatLoading";
const apiUrl = process.env.REACT_APP_API_URL;

const MyChat = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const { user, selectedChat, setSelectedChat, chats, setChats } = ChatState();
  const toast = useToast();

  const bg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("black", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const chatListBg = useColorModeValue("#F8F8F8", "gray.700");
  const selectedChatBg = useColorModeValue("#38B2AC", "teal.600");
  const unselectedChatBg = useColorModeValue("#E8E8E8", "gray.600");
  const buttonHoverBg = useColorModeValue("gray.100", "gray.700");
  const chatHoverBg = useColorModeValue("gray.200", "gray.500");

  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(`${apiUrl}/api/chat/fetchChats`, config);
      console.log(data);

      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occured",
        description: "Failed to load the Chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
  }, [fetchAgain]);
  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg={bg}
      w={{ base: "100%", md: "31%" }}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "28px", md: "30px" }}
        fontFamily="Work Sans"
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
        color={textColor}
      >
        My Chats
        <GroupChatModel>
          <Button
            display="flex"
            fontSize={{ base: "17px", md: "10px", lg: "17px" }}
            rightIcon={<AddIcon />}
            bg={bg}
            color={textColor}
            _hover={{
              bg: buttonHoverBg
            }}
          >
            New Group Chat
          </Button>
        </GroupChatModel>
      </Box>
      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg={chatListBg}
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
      >
        {chats ? (
          <Stack overflowY="scroll">
            {chats.map((chat) => (
              <Box
                onClick={() => setSelectedChat(chat)}
                cursor="pointer"
                bg={selectedChat === chat ? selectedChatBg : unselectedChatBg}
                color={selectedChat === chat ? "white" : textColor}
                px={3}
                py={2}
                borderRadius="lg"
                key={chat._id}
                _hover={{
                  bg: selectedChat === chat ? selectedChatBg : chatHoverBg
                }}
              >
                <Text>
                  {!chat.isGroupChat
                    ? getSender(loggedUser, chat.users)
                    : chat.chatName}
                </Text>
              </Box>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChat;
