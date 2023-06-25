import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const endpoint = 'http://54.172.3.231/api/diagramas'

const CreateDiagrama = () => {
    const [name, setname] = useState('')
    const navigate = useNavigate()

    const store = async (e) => {
        e.preventDefault()
        await axios.post(endpoint, { name: name })
        navigate('/')
    }

    return (
        <div>
            <h3>Create Diagrama</h3>
            <form onSubmit={store}>
                <div className='mb-3'>
                    <label className='form-label'>Nombre</label>
                    <input
                        value={name}
                        onChange={(e) => setname(e.target.value)}
                        type='text'
                        className='form-control'
                    />
                </div>
                <button type='submit' className='btn btn-primary'>Store</button>
            </form>
        </div>
    )
}

export default CreateDiagrama