import axios from 'axios';
import 'dotenv/config';

// Base URL loaded from .env file
const BASE_URL = `${process.env.SPRING_BOOT_URL}/api/hello`;


// ─────────────────────────────────────────────────
// GET all HelloWorld records from Spring Boot
// Calls: GET http://localhost:8080/api/hello
// ─────────────────────────────────────────────────
export const fetchAllHelloWorlds = async () => {
  try {
    const { data } = await axios.get(BASE_URL);
     console.error( BASE_URL);
    return data;
  } catch (error) {
    console.error('❌ Error fetching all HelloWorlds:', error.message);
    throw new Error('Failed to fetch HelloWorld records from Spring Boot');
  }
};


// ─────────────────────────────────────────────────
// GET a single HelloWorld by ID from Spring Boot
// Calls: GET http://localhost:8080/api/hello/{id}
// ─────────────────────────────────────────────────
export const fetchHelloWorldById = async (id) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/${id}`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching HelloWorld with id ${id}:`, error.message);
    throw new Error(`Failed to fetch HelloWorld with id ${id}`);
  }
};


// ─────────────────────────────────────────────────
// POST a new HelloWorld record to Spring Boot
// Calls: POST http://localhost:8080/api/hello
// Body:  { message: "Hello World!" }
// ─────────────────────────────────────────────────
export const postHelloWorld = async (message) => {
  try {
    const { data } = await axios.post(BASE_URL, { message });
    return data;
  } catch (error) {
    console.error('❌ Error creating HelloWorld:', error.message);
    throw new Error('Failed to create HelloWorld record in Spring Boot');
  }
};