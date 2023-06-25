import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const endpoint = 'http://54.172.3.231/api'

const ShowDiagramas = () => {
    const [diagramas, setDiagramas] = useState([])

    useEffect(() => {
        getAllDiagramas()
    }, [])

    const getAllDiagramas = async () => {
        const response = await axios.get(`${endpoint}/diagramas`)
        setDiagramas(response.data)
        //console.log(response.data)
    }

    const deleteDiagrama = async (id) => {
        await axios.delete(`${endpoint}/diagramas/${id}`)
        getAllDiagramas()
    }
    return (
        <div>
            <div className='d-grid gap-2'>
                <Link to="/create" className='btn btn-success btn-lg mt-2 mb-2 text-white'>Create</Link>
            </div>

            <table className='table table-striped'>
                <thead className='bg-primary text-white'>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {diagramas.map((diagrama) => (
                        <tr key={diagrama.id}>
                            <td> {diagrama.id} </td>
                            <td> {diagrama.name} </td>
                            <td>
                                <Link to={`/edit/${diagrama.id}`} className='btn btn-warning'>Edit</Link>
                                <Link to={`/show/${diagrama.id}`} className='btn btn-warning'>Show</Link>
                                <button onClick={() => deleteDiagrama(diagrama.id)} className='btn btn-danger'>Delete</button>
                            </td>

                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default ShowDiagramas