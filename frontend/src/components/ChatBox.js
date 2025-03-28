import { Box, IconButton, Menu, MenuButton, MenuList, MenuItem, MenuGroup, Switch, useColorMode, useColorModeValue, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure } from "@chakra-ui/react";
import { SettingsIcon, BellIcon, SunIcon, LockIcon, DownloadIcon, UnlockIcon } from "@chakra-ui/icons";
import React, { useState, useEffect } from "react";
import { ChatState } from "../Context/chatProvider";
import SingleChat from "./SingleChat";
import ChangePassword from "./Authentication/ChangePassword";

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue("white", "gray.800");
  const menuBgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const [settings, setSettings] = useState({
    notifications: true,
    readReceipts: true,
    mediaAutoDownload: true,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('chatSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatSettings', JSON.stringify(settings));
  }, [settings]);

  const handleSettingChange = (setting) => {
    if (setting === 'darkMode') {
      toggleColorMode();
    } else {
      setSettings(prev => ({
        ...prev,
        [setting]: !prev[setting]
      }));
    }
  };

  return (
    <Box
      display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      alignItems="center"
      flexDir="column"
      p={3}
      bg={bgColor}
      w={{ base: "100%", md: "68%" }}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      height="100%"
      position="relative"
    >
      {/* Settings Menu */}
      <Box position="absolute" top={4} right={4} zIndex={2}>
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<SettingsIcon />}
            variant="ghost"
            aria-label="Settings"
            color={useColorModeValue("gray.600", "gray.200")}
            _hover={{
              bg: useColorModeValue("gray.100", "gray.700")
            }}
          />
          <MenuList bg={menuBgColor} borderColor={borderColor}>
            <MenuGroup title="App Settings" color={useColorModeValue("gray.600", "gray.200")}>
              <MenuItem 
                icon={<BellIcon />}
                closeOnSelect={false}
                onClick={() => handleSettingChange('notifications')}
                _hover={{
                  bg: useColorModeValue("gray.100", "gray.600")
                }}
              >
                Notifications
                <Switch 
                  ml="auto" 
                  isChecked={settings.notifications}
                  onChange={() => {}}
                  colorScheme={useColorModeValue("blue", "cyan")}
                />
              </MenuItem>
              <MenuItem 
                icon={<SunIcon />}
                closeOnSelect={false}
                onClick={() => handleSettingChange('darkMode')}
                _hover={{
                  bg: useColorModeValue("gray.100", "gray.600")
                }}
              >
                Dark Mode
                <Switch 
                  ml="auto" 
                  isChecked={colorMode === 'dark'}
                  onChange={() => {}}
                  colorScheme={useColorModeValue("blue", "cyan")}
                />
              </MenuItem>
              <MenuItem 
                icon={<LockIcon />}
                closeOnSelect={false}
                onClick={() => handleSettingChange('readReceipts')}
                _hover={{
                  bg: useColorModeValue("gray.100", "gray.600")
                }}
              >
                Read Receipts
                <Switch 
                  ml="auto" 
                  isChecked={settings.readReceipts}
                  onChange={() => {}}
                  colorScheme={useColorModeValue("blue", "cyan")}
                />
              </MenuItem>
              <MenuItem 
                icon={<DownloadIcon />}
                closeOnSelect={false}
                onClick={() => handleSettingChange('mediaAutoDownload')}
                _hover={{
                  bg: useColorModeValue("gray.100", "gray.600")
                }}
              >
                Auto Download Media
                <Switch 
                  ml="auto" 
                  isChecked={settings.mediaAutoDownload}
                  onChange={() => {}}
                  colorScheme={useColorModeValue("blue", "cyan")}
                />
              </MenuItem>
              <MenuItem
                icon={<UnlockIcon />}
                onClick={onOpen}
                _hover={{
                  bg: useColorModeValue("gray.100", "gray.600")
                }}
              >
                Change Password
              </MenuItem>
            </MenuGroup>
          </MenuList>
        </Menu>
      </Box>

      {selectedChat && (
        <SingleChat 
          fetchAgain={fetchAgain} 
          setFetchAgain={setFetchAgain}
          settings={settings}
        />
      )}

      {/* Change Password Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg={bgColor}>
          <ModalHeader color={useColorModeValue("gray.800", "white")}>Change Password</ModalHeader>
          <ModalCloseButton color={useColorModeValue("gray.800", "white")} />
          <ModalBody pb={6}>
            <ChangePassword />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ChatBox;
