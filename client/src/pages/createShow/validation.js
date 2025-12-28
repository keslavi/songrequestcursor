import {
  yup,
  yupResolver,
} from '@/helpers/form-validation';

export * from '@/helpers/form-validation/errorNotification';

const schema = yup.object().shape({
  name: yup.string().required("Show name is required"),
  dateFrom: yup.date().required("Show start date is required").min(new Date(), "Show start date must be in the future"),
  dateTo: yup.date().required("Show end date is required").min(new Date(), "Show end date must be in the future"),
  location: yup.string().required("Location is required"),
  description: yup.string().optional(),
  status: yup.string().oneOf(['draft', 'published', 'cancelled'], "Invalid status").required("Status is required"),
  showType: yup.string().oneOf(['private', 'public'], "Invalid show type").required("Show type is required"),
  additionalPerformers: yup.array().of(yup.string()).optional(),
  venue: yup.object().shape({
    name: yup.string().optional(),
    phone: yup.string().optional(),
    mapUrl: yup.string().optional(),
    address: yup.object().shape({
      street: yup.string().optional(),
      city: yup.string().optional(),
      state: yup.string().optional(),
      zip: yup.string().optional()
    }),
    location: yup.object().shape({
      coordinates: yup.array().of(yup.number()).length(2).optional(),
      mapsLink: yup.string().optional(),
      placeId: yup.string().optional()
    })
  }),
  settings: yup.object().shape({
    allowRequests: yup.boolean().required("Allow requests setting is required"),
    maxRequestsPerUser: yup.number().min(1, "Must allow at least 1 request per user").max(10, "Cannot allow more than 10 requests per user").required("Max requests per user is required"),
    requestDeadline: yup.date().nullable().optional()
  })
}).test('date-range', 'End date must be after start date', function(value) {
  if (value.dateFrom && value.dateTo) {
    return value.dateTo > value.dateFrom;
  }
  return true;
});

export const resolver = yupResolver(schema); 