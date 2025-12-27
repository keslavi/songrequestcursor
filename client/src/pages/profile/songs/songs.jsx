import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Box, Chip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Edit, Delete } from "@mui/icons-material";
import { store } from "@/store/store";
import { Row, Col } from "components";
import { toast } from "react-toastify";

export const Songs = () => {
  const navigate = useNavigate();
  const songs = store.use.songs();
  const songList = store.use.songList();
  const songDelete = store.use.songDelete();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSongs = async () => {
      setLoading(true);
      await songList();
      setLoading(false);
    };
    loadSongs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this song?")) {
      const success = await songDelete(id);
      if (success) {
        toast.success("Song deleted successfully");
      }
    }
  };

  const columns = [
    { 
      field: 'key', 
      headerName: 'Key', 
      width: 70
    },
    { 
      field: 'songname', 
      headerName: 'Song Name', 
      flex: 1,
      minWidth: 200
    },
    { 
      field: 'bpm', 
      headerName: 'BPM', 
      width: 70
    },
    { 
      field: 'artist', 
      headerName: 'Artist', 
      flex: 1,
      minWidth: 150
    },
    { 
      field: 'year', 
      headerName: 'Year', 
      width: 80
    },
    {
      field: 'tags',
      headerName: 'Tags',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 0.5 }}>
          {(params.value || []).map((tag, idx) => (
            <Chip key={idx} label={tag} size="small" />
          ))}
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            startIcon={<Edit />}
            onClick={() => navigate(`/profile/songs/${params.row.id}`)}
            sx={{ minWidth: 'auto', mr: 1 }}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<Delete />}
            onClick={() => handleDelete(params.row.id)}
            sx={{ minWidth: 'auto' }}
          >
            Delete
          </Button>
        </Box>
      )
    }
  ];

  return (
    <>
      <Row>
        <Col size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <h2>My Songs</h2>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/profile/songs/new')}
            >
              Add Song
            </Button>
          </Box>
        </Col>
      </Row>

      <Row>
        <Col size={12}>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={songs || []}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              loading={loading}
              disableSelectionOnClick
              getRowHeight={() => 'auto'}
              sx={{
                '& .MuiDataGrid-cell': {
                  py: 1
                }
              }}
            />
          </Box>
        </Col>
      </Row>
    </>
  );
};

export default Songs;

