import React, { useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  useToast,
  VStack,
  Box,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: verification code, 3: new password
  const toast = useToast();

  const bgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const handleSendCode = async () => {
    setLoading(true);
    if (!email) {
      toast({
        title: "Please enter your email",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }

    try {
      await axios.post("/api/user/forgot-password", { email });
      toast({
        title: "Reset code sent to your email",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setStep(2);
    } catch (error) {
      toast({
        title: "Error occurred!",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
    setLoading(false);
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    if (!resetCode) {
      toast({
        title: "Please enter the reset code",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }

    try {
      await axios.post("/api/user/verify-reset-code", { email, resetCode });
      setStep(3);
    } catch (error) {
      toast({
        title: "Invalid code",
        description: error.response?.data?.message || "Please try again",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    setLoading(true);
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Please fill all the fields",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }

    try {
      await axios.post("/api/user/reset-password", {
        email,
        resetCode,
        newPassword,
      });

      toast({
        title: "Password reset successful",
        description: "You can now login with your new password",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });

      // Reset all states
      setEmail("");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
      setStep(1);
    } catch (error) {
      toast({
        title: "Error occurred!",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
    setLoading(false);
  };

  return (
    <Box
      bg={bgColor}
      p={4}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <VStack spacing={4} color={textColor}>
        {step === 1 && (
          <>
            <Text fontSize="xl" fontWeight="bold">
              Forgot Password
            </Text>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>
            <Button
              colorScheme="blue"
              width="100%"
              onClick={handleSendCode}
              isLoading={loading}
            >
              Send Reset Code
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <Text fontSize="xl" fontWeight="bold">
              Verify Reset Code
            </Text>
            <Text fontSize="sm">
              Please enter the reset code sent to your email
            </Text>
            <FormControl isRequired>
              <FormLabel>Reset Code</FormLabel>
              <Input
                type="text"
                placeholder="Enter reset code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
              />
            </FormControl>
            <Button
              colorScheme="blue"
              width="100%"
              onClick={handleVerifyCode}
              isLoading={loading}
            >
              Verify Code
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <Text fontSize="xl" fontWeight="bold">
              Reset Password
            </Text>
            <FormControl isRequired>
              <FormLabel>New Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Button
              colorScheme="blue"
              width="100%"
              onClick={handleResetPassword}
              isLoading={loading}
            >
              Reset Password
            </Button>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default ForgotPassword; 