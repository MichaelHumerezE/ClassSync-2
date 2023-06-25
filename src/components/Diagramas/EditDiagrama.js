import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const endpoint = 'http://54.172.3.231/api/diagramas/'

const EditDiagrama = () => {
    const [name, setName] = useState('')
    //const [price, setPrice] = useState(0)
    //const [stock, setStock] = useState(0)
    const navigate = useNavigate()
    const { id } = useParams()

    const update = async (e) => {
        e.preventDefault()
        await axios.put(`${endpoint}${id}`, {
            name: name,
            //price: price,
            //stock: stock
        })
        navigate('/')
    }

    useEffect(() => {
        const getDiagramaById = async () => {
            const response = await axios.get(`${endpoint}${id}`)
            setName(response.data.name)
            //setPrice(response.data.price)
            //setStock(response.data.stock)
        }
        getDiagramaById()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div>
            <h3>Edit Diagrama</h3>
            <form onSubmit={update}>
                <div className='mb-3'>
                    <label className='form-label'>Nombre</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        type='text'
                        className='form-control'
                    />
                </div>
                <button type='submit' className='btn btn-primary'>Update</button>
            </form>
        </div>
    )
}

export default EditDiagrama

