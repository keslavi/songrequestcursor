$headers = @{
  "Content-Type" = "application/json"
  "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODU0M2IyYzRjYTMzNTM5NDc2Y2QxMjAiLCJpYXQiOjE3NTAzNTUwNjYsImV4cCI6MTc1MDQ0MTQ2Nn0.ySeg6NBy6boFy7oDZATtVUhZdu0_JrwDSNr7DeqA5E4"
}
$body = @{
  name = "Test Show"
  dateFrom = "2024-07-01T19:00:00.000Z"
  dateTo = "2024-07-01T22:00:00.000Z"
  location = "Test Venue"
  status = "draft"
  venue = @{
    name = "Test Venue"
    phone = "123-456-7890"
    mapUrl = "https://maps.google.com"
    address = @{
      street = "123 Main St"
      city = "Test City"
      state = "TS"
      zip = "12345"
    }
    location = @{
      coordinates = @(0,0)
      mapsLink = "https://maps.google.com"
    }
  }
  settings = @{
    maxSongsPerRequest = 3
    requestDeadline = "2024-07-01T18:00:00.000Z"
  }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:5000/api/shows" -Method POST -Headers $headers -Body $body