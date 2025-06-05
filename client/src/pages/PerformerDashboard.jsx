import { useState } from 'react';
import {
  Box,
  Container,
  Tab,
  Tabs,
  Typography,
  Paper
} from '@mui/material';
import SongManagement from '../components/SongManagement';
import ShowManagement from '../components/ShowManagement';
import RequestQueue from '../components/RequestQueue';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`dashboard-tabpanel-${index}`}
    aria-labelledby={`dashboard-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const PerformerDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Performer Dashboard
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Current Show" />
          <Tab label="Song Catalog" />
          <Tab label="Shows" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <RequestQueue />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <SongManagement />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <ShowManagement />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default PerformerDashboard; 