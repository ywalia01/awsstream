import { Navigate, useRoutes } from "react-router-dom";
// layouts
import VideoUploadPage from "./pages/VideoUploadPage";
import VideoEditPage from "./pages/VideoEditPage";
import VideoPlayerPage from "./pages/VideoPlayerPage";
import VideoListPage from "./pages/VideoListPage";
import VideosPage from "./pages/VideosPage";

export default function Router() {
  const routes = useRoutes([
    { element: <Navigate to="/videos" />, index: true },
    { path: "video-upload", element: <VideoUploadPage /> },
    { path: "videos/:id", element: <VideoPlayerPage /> },
    { path: "video/update/:id", element: <VideoEditPage /> },
    { path: "video-list", element: <VideoListPage /> },
    { path: "videos", element: <VideosPage /> },
  ]);

  return routes;
}
