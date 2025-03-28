import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Badge,
  Button,
  Image,
  VStack,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  MenuDivider,
  MenuGroup,
  Switch,
  useColorModeValue,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Portal,
} from "@chakra-ui/react";
import {
  DeleteIcon,
  EditIcon,
  StarIcon,
  ArrowForwardIcon,
  AttachmentIcon,
  DownloadIcon,
  ViewIcon,
  HamburgerIcon,
  SettingsIcon,
  BellIcon,
  LockIcon,
  SunIcon,
  CheckIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import { ChatState } from "../Context/chatProvider";
import { isLastMessage, isSameSender, isSameSenderMargin, isSameUser } from "../config/ChatLogics";

const ScrollableChat = ({
  messages,
  handleDeleteMessage,
  searchQuery = "",
  onEditMessage,
  onForwardMessage,
  settings,
}) => {
  const { user } = ChatState();
  const messagesEndRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [previewUrl, setPreviewUrl] = useState("");

  // Color mode values
  const myMessageBg = useColorModeValue("#BEE3F8", "#2A4365");
  const otherMessageBg = useColorModeValue("#B9F5D0", "#2D3748");
  const menuBg = useColorModeValue("white", "gray.700");
  const menuHoverBg = useColorModeValue("gray.100", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const modalBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const buttonColorScheme = useColorModeValue("blue", "cyan");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const highlightText = (text) => {
    if (!text || !searchQuery) return text;
    const regex = new RegExp(`(${searchQuery})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <span key={i} style={{ backgroundColor: "yellow" }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const renderFileContent = (message) => {
    if (!message.isFile) return null;

    const fileType = message.fileType?.toLowerCase() || "";
    const fileUrl = message.fileUrl || message.content;

    if (fileType.startsWith("image/")) {
      return (
        <Box position="relative" maxW="300px">
          <Image
            src={fileUrl}
            alt="Shared image"
            borderRadius="md"
            maxH="300px"
            objectFit="contain"
            onClick={() => {
              setPreviewUrl(fileUrl);
              onOpen();
            }}
            cursor="pointer"
          />
          <IconButton
            icon={<ViewIcon />}
            size="sm"
            position="absolute"
            top={2}
            right={2}
            colorScheme="blue"
            onClick={() => {
              setPreviewUrl(fileUrl);
              onOpen();
            }}
          />
        </Box>
      );
    }

    if (fileType.startsWith("video/")) {
      return (
        <Box position="relative" maxW="300px">
          <video
            src={fileUrl}
            controls
            style={{ maxHeight: "300px", width: "100%" }}
          />
          <IconButton
            icon={<ViewIcon />}
            size="sm"
            position="absolute"
            top={2}
            right={2}
            colorScheme="blue"
            onClick={() => {
              setPreviewUrl(fileUrl);
              onOpen();
            }}
          />
        </Box>
      );
    }

    if (fileType === "application/pdf") {
      return (
        <HStack spacing={2}>
          <AttachmentIcon boxSize={6} />
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold">PDF Document</Text>
            <Button
              size="sm"
              colorScheme="blue"
              leftIcon={<DownloadIcon />}
              onClick={() => window.open(fileUrl, "_blank")}
            >
              Open PDF
            </Button>
          </VStack>
        </HStack>
      );
    }

    return (
      <HStack spacing={2}>
        <AttachmentIcon boxSize={6} />
        <VStack align="start" spacing={1}>
          <Text fontWeight="bold">{message.fileName || "Document"}</Text>
          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<DownloadIcon />}
            onClick={() => window.open(fileUrl, "_blank")}
          >
            Download
          </Button>
        </VStack>
      </HStack>
    );
  };

  const renderReadReceipts = (message) => {
    if (!settings?.readReceipts || !message.readBy?.length) return null;

    const readByOthers = message.readBy.filter(r => r.user !== user._id);
    if (readByOthers.length === 0) return null;

    return (
      <Tooltip 
        label={`Read by ${readByOthers.map(r => r.user.name).join(', ')}`}
        placement="bottom"
        hasArrow
      >
        <HStack spacing={0} mt={1}>
          {readByOthers.map((reader, index) => (
            <Box
              key={reader.user._id}
              ml={index > 0 ? -2 : 0}
              zIndex={readByOthers.length - index}
            >
              <CheckIcon 
                color={subTextColor} 
                boxSize={3}
              />
            </Box>
          ))}
        </HStack>
      </Tooltip>
    );
  };

  return (
    <Box
      display="flex"
      flexDir="column"
      overflowY="auto"
      css={{
        "&::-webkit-scrollbar": {
          display: "none",
        },
        "-ms-overflow-style": "none",
        "scrollbar-width": "none",
      }}
    >
      {messages?.map((m, i) => {
        const isMyMessage = m.sender._id === user._id;
        return (
          <Box
            key={m._id}
            display="flex"
            justifyContent={isMyMessage ? "flex-end" : "flex-start"}
            mb={2}
            width="100%"
          >
            {!isMyMessage && (isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) && (
              <Box
                mr={1}
                mt={3}
                cursor="pointer"
                flexShrink={0}
              >
                <img
                  src={m.sender.pic}
                  alt={m.sender.name}
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                  }}
                />
              </Box>
            )}
            <Box
              display="flex"
              flexDirection="column"
              maxW="75%"
              alignItems={isMyMessage ? "flex-end" : "flex-start"}
            >
              <Box
                position="relative"
                bg={isMyMessage ? myMessageBg : otherMessageBg}
                ml={isSameSenderMargin(messages, m, i, user._id)}
                mt={isSameUser(messages, m, i, user._id) ? 3 : 10}
                borderRadius="20px"
                p="5px 15px"
                boxShadow="sm"
              >
                {/* Message menu */}
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<HamburgerIcon />}
                    size="xs"
                    position="absolute"
                    top="2px"
                    right="2px"
                    variant="ghost"
                    zIndex={2}
                    onClick={(e) => e.stopPropagation()}
                    color={textColor}
                    _hover={{
                      bg: menuHoverBg
                    }}
                  />
                  <MenuList bg={menuBg} borderColor={borderColor}>
                    <MenuItem
                      icon={<EditIcon />}
                      onClick={() => onEditMessage(m)}
                      isDisabled={!isMyMessage}
                      _hover={{ bg: menuHoverBg }}
                    >
                      Edit
                    </MenuItem>
                    <MenuItem
                      icon={<ArrowForwardIcon />}
                      onClick={() => onForwardMessage(m)}
                      _hover={{ bg: menuHoverBg }}
                    >
                      Forward
                    </MenuItem>
                    <MenuItem
                      icon={<DeleteIcon />}
                      onClick={() => handleDeleteMessage(m._id)}
                      isDisabled={!isMyMessage}
                      _hover={{ bg: menuHoverBg }}
                    >
                      Delete
                    </MenuItem>
                  </MenuList>
                </Menu>

                <Box>
                  {m.isFile ? (
                    renderFileContent(m)
                  ) : (
                    <Text color={textColor}>{highlightText(m.content)}</Text>
                  )}

                  <Text fontSize="xs" color={subTextColor} mt={1}>
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {m.editHistory?.length > 0 && " (edited)"}
                  </Text>

                  {isMyMessage && renderReadReceipts(m)}
                </Box>
              </Box>
            </Box>
            {isMyMessage && (isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) && (
              <Box
                ml={1}
                mt={3}
                cursor="pointer"
                flexShrink={0}
              >
                <img
                  src={m.sender.pic}
                  alt={m.sender.name}
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                  }}
                />
              </Box>
            )}
          </Box>
        );
      })}
      <div ref={messagesEndRef} />

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader color={textColor}>File Preview</ModalHeader>
          <ModalCloseButton color={textColor} />
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
                  colorScheme={buttonColorScheme}
                >
                  Download File
                </Button>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ScrollableChat;
