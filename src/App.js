import './customcss/style.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

//importar nuestros componentes
import ShowDiagrama from './components/Diagramas/ShowDiagrama';
import CreateDiagrama from './components/Diagramas/CreateDiagrama';
import EditDiagrama from './components/Diagramas/EditDiagrama';
import MyMxGraph from './components/MxGraph/MxGraph';

function App() {
  return (
    <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<ShowDiagrama />} />
            <Route path='/create' element={<CreateDiagrama />} />
            <Route path='/edit/:id' element={<EditDiagrama />} />
            <Route path='/show/:id' element={<MyMxGraph />} />
          </Routes>
        </BrowserRouter>
    </div>
  );
}

export default App;
