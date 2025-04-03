// Chakra imports
import {
  Flex,
  useColorModeValue,
  Button,
  useToast,
  Image,
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  NumberInput,
  NumberInputField,
  VStack,
  HStack,
  Text,
  useDisclosure,
  IconButton,
  Tag,
  TagLabel,
  TagCloseButton
} from "@chakra-ui/react";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";
import Card from "components/Card/Card";
import CardHeader from "components/Card/CardHeader";
import CardBody from "components/Card/CardBody";
import { Table, Tbody, Th, Thead, Tr, Td } from "@chakra-ui/react";
import { EditIcon, DeleteIcon, AddIcon, SearchIcon, TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    title: "",
    body_html: "",
    vendor: "",
    product_type: "General",
    price: "",
    tags: []
  });
  const [newTag, setNewTag] = useState("");
  
  const tokenRef = useRef(null);
  
  const toast = useToast();
  const textColor = useColorModeValue("gray.700", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  
  // Modal controls
  const { 
    isOpen: isDetailsOpen, 
    onOpen: onDetailsOpen, 
    onClose: onDetailsClose 
  } = useDisclosure();
  
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();
  
  const { 
    isOpen: isCreateOpen, 
    onOpen: onCreateOpen, 
    onClose: onCreateClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    tokenRef.current = authToken;
    
    if (authToken) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, []);

  const getAuthHeaders = () => {
    return {
      headers: {
        'Authorization': `Bearer ${tokenRef.current}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "/api/products",
        getAuthHeaders()
      );
      setProducts(response.data.products);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      handleApiError(error, "Error fetching products");
      setLoading(false);
    }
  };

  const handleApiError = (error, defaultMessage) => {
    if (error.response?.status === 401) {
      toast({
        title: "Session expired",
        description: "Please sign in again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      tokenRef.current = null;
    } else {
      toast({
        title: defaultMessage,
        description: error.response?.data?.message || "An error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const extractSku = (productId) => {
    const parts = productId.split('/');
    return parts[parts.length - 1];
  };

  const handleSort = (field) => {
    const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
  };

  const filteredProducts = products
    .filter(product => {
      return (
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.vendor && product.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        extractSku(product.id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      let valueA, valueB;

      if (sortField === "price") {
        valueA = parseFloat(a[sortField]);
        valueB = parseFloat(b[sortField]);
      } else if (sortField === "sku") {
        valueA = extractSku(a.id);
        valueB = extractSku(b.id);
      } else {
        valueA = a[sortField];
        valueB = b[sortField];
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const openProductDetails = (product) => {
    setSelectedProduct(product);
    onDetailsOpen();
  };

  const openEditModal = (product) => {
    setSelectedProduct({...product});
    onEditOpen();
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    onDeleteOpen();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedProduct({ ...selectedProduct, [name]: value });
  };

  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handlePriceChange = (value) => {
    setSelectedProduct({ ...selectedProduct, price: value });
  };

  const handleNewPriceChange = (value) => {
    setNewProduct({ ...newProduct, price: value });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !newProduct.tags.includes(newTag.trim())) {
      setNewProduct({
        ...newProduct,
        tags: [...newProduct.tags, newTag.trim()]
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNewProduct({
      ...newProduct,
      tags: newProduct.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleUpdateProduct = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5000//api/products/${selectedProduct.id}`,
        selectedProduct,
        getAuthHeaders()
      );
      
      toast({
        title: "Product updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      fetchProducts();
      onEditClose();
    } catch (error) {
      console.error("Error updating product:", error);
      handleApiError(error, "Error updating product");
    }
  };

  const handleCreateProduct = async () => {
    try {
      const productData = {
        title: newProduct.title,
        body_html: newProduct.body_html || "",
        vendor: newProduct.vendor || "",
        product_type: newProduct.product_type || "General",
        price: parseFloat(newProduct.price),
        tags: newProduct.tags || []
      };
      
      const response = await axios.post(
        "/api/products",
        productData,
        getAuthHeaders()
      );
      
      toast({
        title: "Product created",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      setNewProduct({
        title: "",
        body_html: "",
        vendor: "",
        product_type: "General",
        price: "",
        tags: []
      });
      
      fetchProducts();
      onCreateClose();
    } catch (error) {
      console.error("Error creating product:", error);
      handleApiError(error, "Error creating product");
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await axios.delete(
        `http://localhost:5000//api/products/${selectedProduct.id}`,
        getAuthHeaders()
      );
      
      toast({
        title: "Product deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      fetchProducts();
      onDeleteClose();
    } catch (error) {
      console.error("Error deleting product:", error);
      handleApiError(error, "Error deleting product");
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <TriangleUpIcon boxSize={3} ml={1} /> : <TriangleDownIcon boxSize={3} ml={1} />;
  };

  return (
    <Flex direction="column" pt={{ base: "120px", md: "75px" }}>
      <Card overflowX={{ sm: "scroll", xl: "hidden" }} pb="0px">
        <CardHeader p="6px 0px 22px 0px">
          <Flex justify="space-between" align="center" mb="1rem" w="100%">
            <Flex direction="column">
              <Flex align="center">
                <Box as="h4" fontSize="xl" fontWeight="700" lineHeight="100%">
                  Products Table
                </Box>
              </Flex>
            </Flex>
            <Flex>
              <InputGroup mr={4} width="300px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="green"
                onClick={onCreateOpen}
                isDisabled={!tokenRef.current}
                _disabled={{
                  opacity: 0.5,
                  cursor: "not-allowed",
                  _hover: {
                    bg: "gray.300"
                  }
                }}
              >
                Add Product
              </Button>
            </Flex>
          </Flex>
        </CardHeader>
        <CardBody>
          <Table variant="simple" color={textColor}>
            <Thead>
              <Tr my=".8rem" pl="0px" color="gray.400">
                <Th borderColor={borderColor} pl="0px">Image</Th>
                <Th 
                  borderColor={borderColor} 
                  cursor="pointer" 
                  onClick={() => handleSort("title")}
                >
                  <Flex align="center">
                    Title {renderSortIcon("title")}
                  </Flex>
                </Th>
                <Th 
                  borderColor={borderColor} 
                  cursor="pointer" 
                  onClick={() => handleSort("sku")}
                >
                  <Flex align="center">
                    SKU {renderSortIcon("sku")}
                  </Flex>
                </Th>
                <Th 
                  borderColor={borderColor} 
                  cursor="pointer" 
                  onClick={() => handleSort("price")}
                >
                  <Flex align="center">
                    Price {renderSortIcon("price")}
                  </Flex>
                </Th>
                <Th borderColor={borderColor}>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={4}>
                    Loading products...
                  </Td>
                </Tr>
              ) : !tokenRef.current ? (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={10}>
                    <Flex direction="column" align="center" justify="center" p={8} bg="gray.50" borderRadius="lg">
                      <Image 
                        src="https://images.pexels.com/photos/1666067/pexels-photo-1666067.jpeg?auto=compress&cs=tinysrgb&w=600
" 
                        boxSize="150px" 
                        mb={6}
                        opacity={0.8}
                      />
                      <Text fontSize="2xl" fontWeight="bold" color="gray.700" mb={2}>
                        Authentication Required
                      </Text>
                      <Text fontSize="lg" color="gray.500" mb={6} textAlign="center">
                        You should be logged in to see this part of the dashboard.
                      </Text>
                      <Button 
                        as={RouterLink}
                        to="/auth/signin"
                        colorScheme="blue"
                        size="lg"
                        px={8}
                        leftIcon={<TriangleUpIcon transform="rotate(90deg)" />}
                      >
                        Sign In Now
                      </Button>
                    </Flex>
                  </Td>
                </Tr>
              ) : filteredProducts.length === 0 ? (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={4}>
                    No products found
                  </Td>
                </Tr>
              ) : (
                filteredProducts.map((product) => (
                  <Tr key={product.id}>
                    <Td borderColor={borderColor} pl="0px">
                      <Image 
                        src={`/api/placeholder/80/80`}
                        fallbackSrc="/api/placeholder/80/80"
                        alt={product.title}
                        boxSize="60px"
                        borderRadius="md"
                        objectFit="cover"
                      />
                    </Td>
                    <Td borderColor={borderColor} cursor="pointer" onClick={() => openProductDetails(product)}>
                      <Flex direction="column">
                        <Box fontSize="md" fontWeight="500" color="blue.500" textDecoration="underline">
                          {product.title}
                        </Box>
                        <Box color="gray.500" fontSize="sm">
                          {product.vendor}
                        </Box>
                      </Flex>
                    </Td>
                    <Td borderColor={borderColor}>
                      {extractSku(product.id)}
                    </Td>
                    <Td borderColor={borderColor}>
                      ${parseFloat(product.price).toFixed(2)}
                    </Td>
                    <Td borderColor={borderColor}>
                      <Flex gap={2}>
                        <IconButton
                          aria-label="Edit product"
                          icon={<EditIcon />}
                          colorScheme="blue"
                          size="sm"
                          onClick={() => openEditModal(product)}
                        />
                        <IconButton
                          aria-label="Delete product"
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          size="sm"
                          onClick={() => openDeleteModal(product)}
                        />
                      </Flex>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Product Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Product Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedProduct && (
              <VStack spacing={4} align="stretch">
                <Box display="flex" justifyContent="center" mb={4}>
                  <Image
                    src={`/api/placeholder/300/300`}
                    fallbackSrc="/api/placeholder/300/300"
                    alt={selectedProduct.title}
                    borderRadius="md"
                    objectFit="cover"
                  />
                </Box>
                <Box>
                  <Text fontWeight="bold" fontSize="xl">{selectedProduct.title}</Text>
                  <Text color="gray.500">{selectedProduct.vendor}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Price:</Text>
                  <Text>${parseFloat(selectedProduct.price).toFixed(2)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">SKU:</Text>
                  <Text>{extractSku(selectedProduct.id)}</Text>
                </Box>
                {selectedProduct.description && (
                  <Box>
                    <Text fontWeight="bold">Description:</Text>
                    <Text>{selectedProduct.description}</Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onDetailsClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Product</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedProduct && (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Title</FormLabel>
                  <Input
                    name="title"
                    value={selectedProduct.title}
                    onChange={handleInputChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Vendor</FormLabel>
                  <Input
                    name="vendor"
                    value={selectedProduct.vendor || ""}
                    onChange={handleInputChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Price</FormLabel>
                  <NumberInput
                    min={0}
                    precision={2}
                    value={selectedProduct.price}
                    onChange={handlePriceChange}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    value={selectedProduct.description || ""}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateProduct}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Product Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Product</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  name="title"
                  value={newProduct.title}
                  onChange={handleNewProductChange}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Vendor</FormLabel>
                <Input
                  name="vendor"
                  value={newProduct.vendor}
                  onChange={handleNewProductChange}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Product Type</FormLabel>
                <Input
                  name="product_type"
                  value={newProduct.product_type}
                  onChange={handleNewProductChange}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Price</FormLabel>
                <NumberInput
                  min={0}
                  precision={2}
                  value={newProduct.price}
                  onChange={handleNewPriceChange}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Description (HTML)</FormLabel>
                <Textarea
                  name="body_html"
                  value={newProduct.body_html}
                  onChange={handleNewProductChange}
                  rows={4}
                  placeholder="<p>Product description here...</p>"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Tags</FormLabel>
                <Flex mb={2}>
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    mr={2}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button onClick={handleAddTag}>Add</Button>
                </Flex>
                <Flex flexWrap="wrap" gap={2}>
                  {newProduct.tags.map((tag, index) => (
                    <Tag
                      key={index}
                      borderRadius="full"
                      variant="solid"
                      colorScheme="blue"
                      size="md"
                    >
                      <TagLabel>{tag}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                    </Tag>
                  ))}
                </Flex>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onCreateClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="green" 
              onClick={handleCreateProduct}
              isDisabled={!newProduct.title || !newProduct.price}
            >
              Create Product
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedProduct && (
              <Text>Are you sure you want to delete "{selectedProduct.title}"?</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteProduct}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}

export default Products;