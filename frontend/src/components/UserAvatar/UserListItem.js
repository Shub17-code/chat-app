import React from "react";
import { Avatar, Box, Text, useColorModeValue } from "@chakra-ui/react";

const UserListItem = ({ user, handleFunction }) => {
  const bg = useColorModeValue("#E8E8E8", "gray.600");
  const hoverBg = useColorModeValue("#38B2AC", "teal.600");
  const textColor = useColorModeValue("black", "white");
  
  return (
    <Box
      onClick={handleFunction}
      cursor="pointer"
      bg={bg}
      _hover={{
        background: hoverBg,
        color: "white",
      }}
      w="100%"
      display="flex"
      alignItems="center"
      color={textColor}
      px={3}
      py={2}
      mb={2}
      borderRadius="lg"
    >
      <Avatar
        mr={2}
        size="sm"
        cursor="pointer"
        name={user.name}
        src={user.pic}
      />
      <Box>
        <Text>{user.name}</Text>
        <Text fontSize="xs" color={useColorModeValue("gray.600", "gray.300")}>
          <b>Email : </b>
          {user.email}
        </Text>
      </Box>
    </Box>
  );
};

export default UserListItem;
