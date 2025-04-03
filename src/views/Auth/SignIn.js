import React, { useState, useEffect } from "react";
// Chakra imports
import {
  Box,
  Flex,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  Switch,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
// Assets
import signInImage from "assets/img/signInImage.png";
import axios from "axios";
import { NavLink, useHistory } from "react-router-dom";

function SignIn() {
  // Chakra color mode
  const titleColor = useColorModeValue("teal.300", "teal.200");
  const textColor = useColorModeValue("gray.400", "white");
  
  // React Router navigation (v5 compatible)
  const history = useHistory();
  
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  
  // Loading state for button
  const [isLoading, setIsLoading] = useState(false);
  
  // Toast for notifications
  const toast = useToast();
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Prepare request data
    const userData = {
      email: formData.email,
      password: formData.password
    };
    
    try {
      // Make API call
      const response = await axios.post(
        '/api/auth/signin', 
        userData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Show success message
      toast({
        title: "Sign in successful.",
        description: "You have been successfully logged in!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Handle successful login
      if (response.data && response.data.access_token) {
        // Store token in localStorage or sessionStorage based on rememberMe
        if (formData.rememberMe) {
          localStorage.setItem("authToken", response.data.access_token);
        } else {
          sessionStorage.setItem("authToken", response.data.access_token);
        }
        
        // Store user info
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }
        
        // Redirect to tables page using history.push (React Router v5)
        history.push('/admin/tables');
      }
      
    } catch (error) {
      // Show error message
      toast({
        title: "Sign in failed.",
        description: error.response?.data?.message || "Invalid credentials. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Flex position='relative' mb='40px'>
      <Flex
        h={{ sm: "initial", md: "75vh", lg: "85vh" }}
        w='100%'
        maxW='1044px'
        mx='auto'
        justifyContent='space-between'
        mb='30px'
        pt={{ sm: "100px", md: "0px" }}>
        <Flex
          alignItems='center'
          justifyContent='start'
          style={{ userSelect: "none" }}
          w={{ base: "100%", md: "50%", lg: "42%" }}>
          <Flex
            direction='column'
            w='100%'
            background='transparent'
            p='48px'
            mt={{ md: "150px", lg: "80px" }}>
            <Heading color={titleColor} fontSize='32px' mb='10px'>
              Welcome Back
            </Heading>
            <Text
              mb='36px'
              ms='4px'
              color={textColor}
              fontWeight='bold'
              fontSize='14px'>
              Enter your email and password to sign in
            </Text>
            <FormControl as="form" onSubmit={handleSubmit}>
              <FormLabel ms='4px' fontSize='sm' fontWeight='normal'>
                Email
              </FormLabel>
              <Input
                borderRadius='15px'
                mb='24px'
                fontSize='sm'
                type='email'
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder='Your email address'
                size='lg'
                required
              />
              <FormLabel ms='4px' fontSize='sm' fontWeight='normal'>
                Password
              </FormLabel>
              <Input
                borderRadius='15px'
                mb='36px'
                fontSize='sm'
                type='password'
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder='Your password'
                size='lg'
                required
              />
              <FormControl display='flex' alignItems='center'>
                
              </FormControl>
              <Button
                fontSize='10px'
                type='submit'
                bg='teal.300'
                w='100%'
                h='45'
                mb='20px'
                color='white'
                mt='20px'
                isLoading={isLoading}
                loadingText="Signing In"
                _hover={{
                  bg: "teal.200",
                }}
                _active={{
                  bg: "teal.400",
                }}>
                SIGN IN
              </Button>
            </FormControl>
            <Flex
              flexDirection='column'
              justifyContent='center'
              alignItems='center'
              maxW='100%'
              mt='0px'>
              <Text color={textColor} fontWeight='medium'>
                Don't have an account?
                <NavLink to='/auth/signup'>
                <Link 
                  color={titleColor} 
                  as='span' 
                  ms='5px' 
                  fontWeight='bold'>
                  Sign Up
                </Link>
                </NavLink>
              </Text>
            </Flex>
          </Flex>
        </Flex>
        <Box
          display={{ base: "none", md: "block" }}
          overflowX='hidden'
          h='100%'
          w='40vw'
          position='absolute'
          right='0px'>
          <Box
            bgImage={signInImage}
            w='100%'
            h='100%'
            bgSize='cover'
            bgPosition='50%'
            position='absolute'
            borderBottomLeftRadius='20px'></Box>
        </Box>
      </Flex>
    </Flex>
  );
}

export default SignIn;