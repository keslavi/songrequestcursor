import * as yup from 'yup';
import dayjs from 'dayjs';

// Helper function to extract coordinates from Google Maps link
const extractCoordinatesFromMapsLink = (link) => {
  try {
    // Handle different Google Maps URL formats
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,  // Format: @lat,lng
      /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // Format: !3d{lat}!4d{lng}
      /\/(-?\d+\.\d+),(-?\d+\.\d+)/, // Format: /lat,lng
    ];

    for (const pattern of patterns) {
      const match = link.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return [lng, lat]; // MongoDB uses [longitude, latitude] format
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Show validation schema
export const showSchema = yup.object().shape({
  venue: yup.object().shape({
    name: yup
      .string()
      .required('Venue name is required')
      .min(2, 'Venue name must be at least 2 characters'),
    
    address: yup.object().shape({
      street: yup
        .string()
        .required('Street address is required')
        .min(5, 'Street address must be at least 5 characters'),
      city: yup
        .string()
        .required('City is required')
        .min(2, 'City must be at least 2 characters'),
      state: yup
        .string()
        .required('State is required')
        .min(2, 'State must be at least 2 characters'),
      zip: yup
        .string()
        .required('ZIP code is required')
        .matches(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
    }),

    location: yup.object().shape({
      coordinates: yup
        .array()
        .of(yup.number())
        .length(2, 'Coordinates must be [longitude, latitude]')
        .required('Coordinates are required'),
      mapsLink: yup
        .string()
        .required('Google Maps link is required')
        .url('Must be a valid URL')
        .test('is-google-maps', 'Must be a Google Maps URL', value => {
          return value.includes('google.com/maps') || value.includes('goo.gl/maps');
        })
        .test('has-coordinates', 'Unable to extract coordinates from link', value => {
          return extractCoordinatesFromMapsLink(value) !== null;
        })
    })
  }),

  dateTime: yup
    .mixed()
    .test('is-date', 'Invalid date', value => dayjs.isDayjs(value) || value instanceof Date)
    .test('is-future', 'Show must be scheduled in the future', value => {
      const date = dayjs(value);
      return date.isValid() && date.isAfter(dayjs());
    }),
  
  duration: yup
    .number()
    .required('Duration is required')
    .min(30, 'Show must be at least 30 minutes')
    .max(480, 'Show cannot be longer than 8 hours'),

  managers: yup
    .array()
    .of(
      yup.object().shape({
        _id: yup.string().required(),
        profile: yup.object().shape({
          name: yup.string().required()
        })
      })
    )
    .min(1, 'At least one manager is required'),

  additionalPerformers: yup
    .array()
    .of(
      yup.object().shape({
        _id: yup.string().required(),
        profile: yup.object().shape({
          name: yup.string().required()
        })
      })
    ),

  settings: yup.object().shape({
    maxRequestsPerUser: yup
      .number()
      .required('Max requests per user is required')
      .min(1, 'Must allow at least 1 request per user')
      .max(10, 'Cannot allow more than 10 requests per user'),
    allowExplicitSongs: yup
      .boolean()
      .required('Allow explicit songs setting is required')
  })
});

// Request validation schema
export const requestSchema = yup.object().shape({
  songs: yup
    .array()
    .of(
      yup.object().shape({
        songId: yup.string().required('Song ID is required'),
        name: yup.string(),
        artist: yup.string()
      })
    )
    .min(1, 'At least one song is required')
    .max(3, 'Maximum of 3 songs allowed'),

  requester: yup.object().shape({
    name: yup
      .string()
      .required('Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: yup
      .string()
      .required('Email is required')
      .email('Invalid email format'),
    venmoUsername: yup
      .string()
      .required('Venmo username is required')
      .matches(/^@?[a-zA-Z0-9-]+$/, 'Invalid Venmo username format')
  }),

  tip: yup
    .number()
    .required('Tip amount is required')
    .min(0, 'Tip cannot be negative'),

  notes: yup
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
});

// Payment validation schema
export const paymentSchema = yup.object().shape({
  venmoReceipt: yup
    .string()
    .required('Venmo receipt is required')
    .matches(/^[A-Za-z0-9\-]+$/, 'Invalid receipt format')
});

// Status update validation schema
export const statusUpdateSchema = yup.object().shape({
  status: yup
    .string()
    .oneOf(['pending', 'paid', 'playing', 'played', 'cancelled'], 'Invalid status')
    .required('Status is required')
});

// Location search validation schema
export const locationSearchSchema = yup.object().shape({
  latitude: yup
    .number()
    .required('Latitude is required')
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude'),
  
  longitude: yup
    .number()
    .required('Longitude is required')
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude')
}); 