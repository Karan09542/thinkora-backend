import { Request } from "express";

declare global {
  namespace Express { 
    // Extend the Request interface with your custom properties
    export interface Request {
      userId?: string; // Example of an optional custom property
      isSubscriber?: boolean; // Another optional custom property
      // Add other properties here as needed
    }
  }
}

export {}
