import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Collection from "./pages/Collection";
import GroceryList from "./pages/GroceryList";

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        {/* <Route path="/" element={<UploadPage />} /> */}
        <Route path="/" element={<Collection />} />
        <Route path="/grocerylist" element={<GroceryList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
