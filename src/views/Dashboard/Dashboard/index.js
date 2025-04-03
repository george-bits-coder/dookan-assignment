import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  FormControl,
  FormLabel,
  Stack,
  Flex,
  Text,
  Badge,
  Divider,
  HStack,
  useToast,
  useColorModeValue,
  InputGroup,
  InputRightElement,
  IconButton,
  Button
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { CalendarIcon } from '@chakra-ui/icons';

export default function EventLogDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uniqueEventTypes, setUniqueEventTypes] = useState([]);
  const [uniqueUserIds, setUniqueUserIds] = useState([]);
  const [totalEvents, setTotalEvents] = useState(0);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const toast = useToast();

  // Chart data
  const [chartData, setChartData] = useState([]);
  const [chartView, setChartView] = useState('area');
  
  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBgColor = useColorModeValue('gray.50', 'gray.700');
  
  // Color palette for chart lines - more visually appealing
  const colorPalette = [
    '#3182CE', '#E53E3E', '#38A169', '#805AD5', '#DD6B20', 
    '#00B5D8', '#D53F8C', '#ECC94B', '#4FD1C5', '#718096'
  ];

  // Refs for date inputs to handle click events
  const startDateInputRef = useRef(null);
  const endDateInputRef = useRef(null);

  useEffect(() => {
    fetchEventLogs();
  }, []);

  const fetchEventLogs = async () => {
    setLoading(true);
    try {
      // Build query params for filtering
      const params = new URLSearchParams();
      if (selectedEventType) params.append('event_type', selectedEventType);
      if (selectedUserId) params.append('user_id', selectedUserId);
      if (startDate) params.append('start_time', new Date(startDate).toISOString());
      if (endDate) params.append('end_time', new Date(endDate).toISOString());
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      // Use the actual endpoint
      const response = await fetch(`/api/events${queryString}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      setEvents(data.events || []);
      setTotalEvents(data.count || 0);
      
      // Extract unique event types and user IDs
      const eventTypes = [...new Set(data.events.map(event => event.event_type))];
      const userIds = [...new Set(data.events.map(event => event.user_id))];
      
      setUniqueEventTypes(eventTypes);
      setUniqueUserIds(userIds);
      
      // Process data for charts
      processChartData(data.events);
      
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error fetching data',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (eventData) => {
    if (!eventData || eventData.length === 0) {
      setChartData([]);
      return;
    }

    // Sort events by timestamp
    const sortedEvents = [...eventData].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Group events by day
    const eventsByDay = sortedEvents.reduce((acc, event) => {
      if (!event.timestamp) return acc;
      
      const date = new Date(event.timestamp);
      // Store the full date for proper date handling
      const day = date.toISOString().split('T')[0];
      
      if (!acc[day]) {
        acc[day] = { 
          date: day, 
          // Include year in the formatted date for display
          formattedDate: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          // Store the full timestamp for tooltips
          timestamp: date.toISOString(),
          count: 0 
        };
      }
      acc[day].count += 1;
      
      // Also track event types
      const eventType = event.event_type;
      if (!acc[day][eventType]) {
        acc[day][eventType] = 0;
      }
      acc[day][eventType] += 1;
      
      return acc;
    }, {});

    const chartData = Object.values(eventsByDay);
    setChartData(chartData);
  };

  const applyFilters = () => {
    fetchEventLogs();
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedEventType('');
    setSelectedUserId('');
    // Fetch all events without filters
    setTimeout(() => {
      fetchEventLogs();
    }, 0);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Helper function to handle clicks on date inputs
  const handleDateInputClick = (ref) => {
    if (ref.current) {
      ref.current.showPicker();
    }
  };

  // Custom Panel Component to replace Card
  const Panel = ({ children, title, mb = 6 }) => (
    <Box 
      mb={mb} 
      bg={bgColor} 
      boxShadow="md" 
      borderRadius="lg" 
      overflow="hidden" 
      borderWidth="1px" 
      borderColor={borderColor}
      position="relative"
    >
      {title && (
        <Box p={4} bg={headerBgColor} borderBottomWidth="1px" borderColor={borderColor}>
          <Heading size="md">{title}</Heading>
        </Box>
      )}
      <Box p={4}>
        {children}
      </Box>
    </Box>
  );

  // Custom tooltip for charts - fixed to use the correct date format
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Use the timestamp from the data point if available
      const datePart = payload[0]?.payload?.timestamp || label;
      
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="lg" borderWidth="1px" borderColor="gray.200">
          <Text fontWeight="bold">
            {datePart ? new Date(datePart).toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric'
            }) : ''}
          </Text>
          <Divider my={2} />
          {payload.map((entry, index) => (
            <Text key={`item-${index}`} color={entry.color}>
              {entry.name}: {entry.value}
            </Text>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Container maxW="container.xl" pt={50} py={6}>
      <Heading as="h1" size="xl" mb={8} textAlign="center">
        Event Log Dashboard
      </Heading>
      
      {/* Filters Panel */}
      <Panel title="Filters">
        <Stack spacing={6}>
          <Flex direction={{ base: "column", md: "row" }} gap={4}>
            <FormControl>
              <FormLabel>Start Date</FormLabel>
              <InputGroup onClick={() => handleDateInputClick(startDateInputRef)}>
                <Input
                  ref={startDateInputRef}
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  borderRadius="md"
                  cursor="pointer"
                />
                <InputRightElement>
                  <CalendarIcon color="gray.500" />
                </InputRightElement>
              </InputGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel>End Date</FormLabel>
              <InputGroup onClick={() => handleDateInputClick(endDateInputRef)}>
                <Input
                  ref={endDateInputRef}
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  borderRadius="md"
                  cursor="pointer"
                />
                <InputRightElement>
                  <CalendarIcon color="gray.500" />
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </Flex>
          
          <Flex direction={{ base: "column", md: "row" }} gap={4}>
            <FormControl>
              <FormLabel>Event Type</FormLabel>
              <Select 
                placeholder="All Event Types"
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                borderRadius="md"
              >
                {uniqueEventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>User ID</FormLabel>
              <Select 
                placeholder="All Users"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                borderRadius="md"
              >
                {uniqueUserIds.map(id => (
                  <option key={id} value={id}>{id.substring(0, 12)}...</option>
                ))}
              </Select>
            </FormControl>
          </Flex>
          
          <Flex justify="flex-end" gap={4}>
            <Button 
              variant="outline" 
              colorScheme="blue" 
              onClick={resetFilters}
              size="md"
            >
              Reset Filters
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={applyFilters}
              size="md"
            >
              Apply Filters
            </Button>
          </Flex>
        </Stack>
      </Panel>
      
      {/* Visualization Panel */}
      <Panel title="Events Over Time">
        <Flex justifyContent="flex-end" mb={4}>
          <Select 
            width="200px" 
            value={chartView} 
            onChange={(e) => setChartView(e.target.value)}
            size="sm"
            borderRadius="md"
          >
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
            <option value="bar">Bar Chart</option>
          </Select>
        </Flex>
        
        {loading ? (
          <Text textAlign="center" py={8}>Loading chart data...</Text>
        ) : chartData.length === 0 ? (
          <Text textAlign="center" py={8}>No data available for chart</Text>  
        ) : (
          <Box h="400px" mt={4}>
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'line' && (
                <LineChart 
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis 
                    dataKey="formattedDate" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke={colorPalette[0]} 
                    name="Total Events" 
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                  {uniqueEventTypes.map((type, index) => (
                    <Line
                      key={type}
                      type="monotone"
                      dataKey={type}
                      name={type}
                      stroke={colorPalette[(index + 1) % colorPalette.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      animationDuration={1500}
                    />
                  ))}
                </LineChart>
              )}
              {chartView === 'area' && (
                <AreaChart 
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <defs>
                    {uniqueEventTypes.map((type, index) => (
                      <linearGradient key={`gradient-${type}`} id={`color-${type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colorPalette[(index + 1) % colorPalette.length]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={colorPalette[(index + 1) % colorPalette.length]} stopOpacity={0.2}/>
                      </linearGradient>
                    ))}
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colorPalette[0]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={colorPalette[0]} stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis 
                    dataKey="formattedDate" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={colorPalette[0]} 
                    fill="url(#colorTotal)" 
                    name="Total Events" 
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                  {uniqueEventTypes.map((type, index) => (
                    <Area
                      key={type}
                      type="monotone"
                      dataKey={type}
                      name={type}
                      stroke={colorPalette[(index + 1) % colorPalette.length]}
                      fill={`url(#color-${type})`}
                      strokeWidth={1.5}
                      animationDuration={1500}
                    />
                  ))}
                </AreaChart>
              )}
              {chartView === 'bar' && (
                <BarChart 
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis 
                    dataKey="formattedDate" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar 
                    dataKey="count" 
                    fill={colorPalette[0]} 
                    name="Total Events" 
                    animationDuration={1500}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Box>
        )}
      </Panel>
      
      {/* Event Log Table Panel */}
      <Panel title="Event Logs" mb={0}>
        {loading ? (
          <Text textAlign="center" py={8}>Loading events...</Text>
        ) : error ? (
          <Text color="red.500" textAlign="center" py={8}>Error: {error}</Text>
        ) : events.length === 0 ? (
          <Text textAlign="center" py={8}>No events found</Text>
        ) : (
          <>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr bg={headerBgColor}>
                    <Th>Event ID</Th>
                    <Th>Timestamp</Th>
                    <Th>Event Type</Th>
                    <Th>User ID</Th>
                    <Th>Product ID</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {events.slice(0, 10).map((event) => (
                    <Tr key={event.event_id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                      <Td>{event.event_id}</Td>
                      <Td>{formatTimestamp(event.timestamp)}</Td>
                      <Td>
                        <Badge 
                          colorScheme={
                            event.event_type === "VIEW" ? "blue" : 
                            event.event_type === "CLICK" ? "green" : 
                            event.event_type === "PURCHASE" ? "purple" : 
                            event.event_type === "LOGIN" ? "orange" : 
                            "gray"
                          }
                          px={2} 
                          py={1} 
                          borderRadius="full"
                        >
                          {event.event_type}
                        </Badge>
                      </Td>
                      <Td>
                        <Text isTruncated maxW="200px" title={event.user_id}>
                          {event.user_id}
                        </Text>
                      </Td>
                      <Td>{event.product_id}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
            <Divider my={4} />
            <Text fontSize="sm" color="gray.500">
              Total Events: {totalEvents}
            </Text>
          </>
        )}
      </Panel>
    </Container>
  );
}