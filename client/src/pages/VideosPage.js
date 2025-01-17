import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import axios from "axios";
import { Container, Stack, Typography } from "@mui/material";
import { VideoSort, VideoList } from "../sections/@dashboard/products";
import { API_SERVER } from "../constants";

// ----------------------------------------------------------------------

export default function ProductsPage() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const getData = async () => {
      const response = await axios.post(`${API_SERVER}/api/videos/search`, {});
      console.log("getData", response.data);
      response.data.sort((a, b) =>
        b.viewCount - a.viewCount === 0
          ? new Date(b.recordingDate) - new Date(a.recordingDate)
          : b.viewCount - a.viewCount
      );
      setVideos(response.data);
    };

    getData();
  }, []);

  return (
    <>
      <Helmet>
        <title> Dashboard: Products | Minimal UI </title>
      </Helmet>

      <Container>
        <Typography variant="h4" sx={{ mb: 5 }}>
          Products
        </Typography>

        <Stack
          direction="row"
          flexWrap="wrap-reverse"
          alignItems="center"
          justifyContent="flex-end"
          sx={{ mb: 5 }}
        >
          <Stack direction="row" spacing={1} flexShrink={0} sx={{ my: 1 }}>
            {/* <ProductFilterSidebar
              openFilter={openFilter}
              onOpenFilter={handleOpenFilter}
              onCloseFilter={handleCloseFilter}
            /> */}
            <VideoSort setVideos={setVideos} />
          </Stack>
        </Stack>

        <VideoList videos={videos} />
      </Container>
    </>
  );
}
