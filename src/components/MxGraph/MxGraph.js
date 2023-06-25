import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import mxgraph from "mxgraph";
import DB from "../../firebase/firestoreProvider";
import '../../App.css';
import { db } from "../../firebase/firebaseConfig";
import { toPng } from 'dom-to-image';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { Timestamp, collection, deleteDoc, getDocs, doc, setDoc, addDoc, onSnapshot, query, where, orderBy, updateDoc, arrayUnion, arrayRemove, limit, serverTimestamp } from "firebase/firestore";

const endpoint = 'http://54.172.3.231/api/diagramas/'

const mxnspaceobj = mxgraph({
    mxImageBasePath: "mxgraph/javascript/src/images",
    mxBasePath: "mxgraph/javascript/src"
});

/*const mxCell = mxnspaceobj.mxCell;
const mxGeometry = mxnspaceobj.mxGeometry;
const mxRubberband = mxnspaceobj.mxRubberband;
const mxKeyHandler = mxnspaceobj.mxKeyHandler;
const mxUtils = mxnspaceobj.mxUtils;
const mxEvent = mxnspaceobj.mxEvent;
const mxConstants = mxnspaceobj.mxConstants;*/

const { mxConstants, mxShape, mxCellRenderer, mxGraph, mxRubberband, mxRectangle, mxClient, mxImage, mxUtils, mxEvent, mxIconSet, mxWindow, mxCell, mxGeometry, mxPoint } = mxgraph();

const MyMxGraph = () => {

    const [name, setName] = useState('');
    const { id } = useParams();
    const [clases, setClases] = useState([]);
    const [edges, setEdges] = useState([]);
    const selectedVertex = useRef(null);
    const selectedEdge = useRef(null);
    const [atribute, setAtribute] = useState('');
    const [tipoDato, setTipoDato] = useState('');
    const graphContainerRef = useRef(null);
    const [conection, setConection] = useState('Asociación');
    const [nameRel, setNameRel] = useState('');
    const [multiOrig, setMultiOrig] = useState('');
    const [multiDest, setMultiDest] = useState('');

    let vID = [];
    let Relaciones = [];

    const doc = mxUtils.createXmlDocument();

    const getDiagramaById = async () => {
        const response = await axios.get(`${endpoint}${id}`);
        setName(response.data.name);
    }

    const getClases = async () => {
        await DB.getClases(id, setClases);
    }

    const getRelaciones = async () => {
        await DB.getRelaciones(id, setEdges);
    }

    const createGraph = () => {
        selectedVertex.current = null;
        selectedEdge.current = null;
        const container = graphContainerRef.current;
        if (!container) return; // Verificar si el contenedor ya existe
        container.innerHTML = ''; // Limpiar el contenido existente
        const graph = new mxGraph(container);
        graph.setConnectable(true);

        const style = graph.getStylesheet().getDefaultVertexStyle();
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
        style[mxConstants.STYLE_ROUNDED] = false;
        style[mxConstants.STYLE_FILLCOLOR] = '#ffdead';
        style[mxConstants.STYLE_STROKECOLOR] = '#000000';
        style[mxConstants.STYLE_FONTCOLOR] = '#000000';
        style[mxConstants.STYLE_FONTSTYLE] = 1; // Negrita
        style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP; // Alinear en la parte superior
        style[mxConstants.STYLE_VERTICAL_LABEL_POSITION] = mxConstants.ALIGN_MIDDLE; // Posición de la etiqueta en el centro verticalmente

        new mxRubberband(graph);
        const parent = graph.getDefaultParent();

        graph.getModel().beginUpdate();
        try {
            const keys = Object.keys(clases);
            keys.forEach((key) => {
                const element = clases[key];
                const newNode = doc.createElement(element['nombre']);
                DB.getAtributos(element['claseID'], newNode);
                vID[element['claseID']] = graph.insertVertex(parent, null, newNode, element['x'], element['y'], element['width'], element['height']);
                const q1 = query(collection(db, "atributos"), where('classID', '==', element['claseID']));
                onSnapshot(q1, async (querySnapshot) => {
                    let i = 1;
                    querySnapshot.forEach(async (doc) => {
                        await newNode.setAttribute(doc.data().atributo, doc.data().tipoDato);
                        var vertexAttribute = graph.insertVertex(vID[element['claseID']], null, doc.data().atributo + ": " + doc.data().tipoDato, 0, i * 30, element['width'], element['height'], "shape=rectangle;whiteSpace=wrap;html=1;resizable=0;");
                        vertexAttribute.setConnectable(false);
                        i = i + 1;
                    });
                });
                //graph.insertVertex(vID[element['claseID']], null, 'Nombre', 0, 30, element['width'], element['height'], "shape=rectangle;whiteSpace=wrap;html=1;");
                /*const attributes = vID[element['claseID']].value.attributes;
                let i = 1;
                for (const attributeName in attributes) {
                    const attributeValue = attributes[attributeName];
                    if (attributeValue.value != undefined) {
                        graph.insertVertex(vID[element['claseID']], null, attributeValue.name, 0, i * 30, element['width'], element['height'], "shape=rectangle;whiteSpace=wrap;html=1;");
                        console.log(`${attributeValue.name}: ${attributeValue.value}`);
                    }
                }*/
            });

            const q2 = query(collection(db, "relaciones"), where('id_diagrama', '==', parseInt(id)));
            onSnapshot(q2, async (querySnapshot) => {
                let i = 1;
                querySnapshot.forEach(async (doc) => {
                    if (doc.data().tipo_rel != 'Herencia') {
                        // Agregar etiquetas a la arista
                        const multi_orig = graph.insertEdge(parent, null, doc.data().multi_orig, vID[doc.data().class_orig], vID[doc.data().class_dest]);
                        multi_orig.geometry.relative = true;
                        multi_orig.geometry.x = -0.80;
                        multi_orig.geometry.y = 10;
                        multi_orig.style = 'text;html=1;strokeColor=none;fillColor=none;fontColor=#000000;';

                        const multi_dest = graph.insertEdge(parent, null, doc.data().multi_dest, vID[doc.data().class_orig], vID[doc.data().class_dest]);
                        multi_dest.geometry.relative = true;
                        multi_dest.geometry.x = 0.80;
                        multi_dest.geometry.y = 10;
                        multi_dest.style = 'text;html=1;strokeColor=none;fillColor=none;fontColor=#000000;';
                    }

                    //Relacion Principal
                    if (doc.data().tipo_rel == 'Asociación') {
                        Relaciones[i] = graph.insertEdge(parent, null, doc.data().nombre, vID[doc.data().class_orig], vID[doc.data().class_dest]);
                        Relaciones[i].geometry.y = 10;
                        Relaciones[i].style = 'endArrow=none;strokeColor=#000000;fontColor=#000000;strokeWidth=2;'; //Asociacion
                        Relaciones[i].relID = doc.id;
                    }
                    if (doc.data().tipo_rel == 'Agregación') {
                        Relaciones[i] = graph.insertEdge(parent, null, doc.data().nombre, vID[doc.data().class_orig], vID[doc.data().class_dest]);
                        Relaciones[i].geometry.y = 10;
                        Relaciones[i].style = 'endArrow=diamond;endFill=0;strokeWidth=2;strokeColor=#000000;fontColor=#000000;endSize=20;'; //Agregacion
                        Relaciones[i].relID = doc.id;
                    }
                    if (doc.data().tipo_rel == 'Composición') {
                        Relaciones[i] = graph.insertEdge(parent, null, doc.data().nombre, vID[doc.data().class_orig], vID[doc.data().class_dest]);
                        Relaciones[i].geometry.y = 10;
                        Relaciones[i].style = 'endArrow=diamond;endFill=1;strokeWidth=2;strokeColor=#000000;fontColor=#000000;endSize=20;'; //Composicion
                        Relaciones[i].relID = doc.id;
                    }
                    if (doc.data().tipo_rel == 'Herencia') {
                        Relaciones[i] = graph.insertEdge(parent, null, '', vID[doc.data().class_orig], vID[doc.data().class_dest]);
                        Relaciones[i].geometry.y = 10;
                        Relaciones[i].style = 'endArrow=block;endFill=0;strokeWidth=2;strokeColor=#000000;fontColor=#000000;endSize=20;'; //Herencia
                        Relaciones[i].relID = doc.id;
                    }
                    i = i + 1;
                });
                graph.refresh();
            });

        } finally {
            graph.getModel().endUpdate();
        }

        //Al mover las clases
        graph.addListener(mxEvent.CELLS_MOVED, (sender, evt) => {
            const cells = evt.getProperty('cells');
            const keys = Object.keys(clases);
            keys.forEach((key) => {
                const element = clases[key];
                if (cells.includes(vID[element['claseID']])) {
                    clases[key]['x'] = vID[element['claseID']].getGeometry().x;
                    clases[key]['y'] = vID[element['claseID']].getGeometry().y;
                    const { claseID, ...resto } = clases[key];      //Quitar claseID
                    DB.updateClase(clases[key]['claseID'], resto);  //Actualizar la posicion de la clase
                }
            });
        });

        //Al cambiar el nombre de las clases
        graph.addListener(mxEvent.LABEL_CHANGED, (sender, evt) => {
            const cell = evt.getProperty('cell');
            const keys = Object.keys(clases);
            const newName = cell.getValue();
            keys.forEach((key) => {
                const element = clases[key];
                if (cell.getId() == vID[element['claseID']].getId()) {
                    clases[key]['nombre'] = newName;
                    const { claseID, ...resto } = clases[key];      //Quitar claseID
                    DB.updateClase(clases[key]['claseID'], resto);  //Actualizar el nombre de la clase
                }
            });
        });

        //Al redimensionar las clases
        graph.addListener(mxEvent.RESIZE_CELLS, (sender, evt) => {
            const cells = evt.getProperty('cells');
            const keys = Object.keys(clases);
            keys.forEach((key) => {
                const element = clases[key];
                if (cells[0].getId() == vID[element['claseID']].getId()) {
                    clases[key]['height'] = vID[element['claseID']].getGeometry().height;
                    clases[key]['width'] = vID[element['claseID']].getGeometry().width;
                    const { claseID, ...resto } = clases[key];      //Quitar claseID
                    DB.updateClase(clases[key]['claseID'], resto);  //Actualizar el tamaño de la clase
                }
            });
            createGraph();
        });

        //Al hacer click en un vertice o clase
        graph.addListener(mxEvent.CLICK, (sender, evt) => {
            const cell = evt.getProperty('cell');
            if (cell && cell.isVertex()) {
                selectedVertex.current = cell;
                selectedEdge.current = null;
                //----------------------------------
                const attributes = selectedVertex.current.value.attributes;
                for (const attributeName in attributes) {
                    const attributeValue = attributes[attributeName];
                    if (attributeValue.value != undefined) {
                        console.log(`${attributeValue.name}: ${attributeValue.value}`);
                    }
                }
            }
            if (cell && cell.isEdge()) {
                selectedEdge.current = cell;
                selectedVertex.current = null;
            }
        });

        //Al conectar vertices
        graph.connectionHandler.addListener(mxEvent.CONNECT, function (sender, evt) {
            var edge = evt.getProperty('cell');
            var source = graph.getModel().getTerminal(edge, true);
            var target = graph.getModel().getTerminal(edge, false);
            var idOrig = '';
            var idDest = '';
            const keys = Object.keys(clases);
            keys.forEach((key) => {
                const element = clases[key];
                if (source.id == vID[element['claseID']].getId()) {
                    idOrig = element['claseID'];
                }
                if (target.id == vID[element['claseID']].getId()) {
                    idDest = element['claseID'];
                }
            });
            if (conection != 'Herencia' && nameRel != '' && multiOrig != '' && multiDest != '' && idOrig != '' && idDest != '') {
                DB.createRelacion(id, idOrig, idDest, nameRel, multiOrig, multiDest, conection);
                setNameRel('');
                setMultiOrig('');
                setMultiDest('');
            } else {
                DB.createRelHerencia(id, idOrig, idDest, conection);
                setNameRel('');
                setMultiOrig('');
                setMultiDest('');
            }
        });
    };

    //Barra de menú
    const initializePalette = () => {
        const paletteContainer = document.getElementById("palette");

        // Agregar eventos de arrastrar y soltar a los elementos de la paleta
        const paletteBoxes = paletteContainer.getElementsByClassName("palette-box");
        Array.from(paletteBoxes).forEach((box) => {
            box.addEventListener("dragstart", (event) => {
                // Iniciar la operación de arrastre con el ID del elemento
                event.dataTransfer.setData("text/plain", event.target.id);
            });
        });

        // Agregar evento de soltar al contenedor del diagrama
        const diagramContainer = document.getElementById("mxcontainer");

        diagramContainer.addEventListener("dragover", (event) => {
            event.preventDefault();
        });

        diagramContainer.addEventListener("drop", async (event) => {
            event.preventDefault();
            const draggedElementId = event.dataTransfer.getData("text/plain");
            var parts = draggedElementId.split('/');
            var fileName = parts[parts.length - 1];
            console.log(fileName); // Imprimirá "...Icon.png"

            // Crear un nuevo vértice en el grafo en la posición del soltado
            if (fileName === "classIcon.png") {
                const x = event.offsetX;
                const y = event.offsetY;
                DB.createClase(id, 'newClase', x, y, 30, 80);
            }
        });
    };

    const handleDeleteVertex = async () => {
        if (selectedVertex.current != null) {
            const keys = Object.keys(clases);
            keys.forEach((key) => {
                const element = clases[key];
                if (selectedVertex.current.getId() == vID[element['claseID']].getId()) {
                    const newClases = clases.filter((clase) => clase['claseID'] !== element['claseID']);
                    DB.deleteClase(element['claseID']);     //Eliminar una clase
                    setClases(newClases);
                }
            });
            selectedVertex.current = null;
        }
        if (selectedEdge.current != null) {
            for (let i = 1; i < Relaciones.length; i++) {
                const element = Relaciones[i];
                if (selectedEdge.current.id == element.id) {
                    console.log('eliminado');
                    const newEdges = edges.filter((edge) => edge['relID'] !== element.id);
                    DB.deleteRelacion(element.relID);
                    setEdges(newEdges);
                }
            }
        }
    };

    const saveAtributo = () => {
        if (selectedVertex.current && atribute != '' && tipoDato != '') {
            const keys = Object.keys(clases);
            keys.forEach((key) => {
                const element = clases[key];
                if (selectedVertex.current.id == vID[element['claseID']].id) {
                    DB.createAttribute(element['claseID'], atribute, tipoDato);     //Eliminar una clase
                    setAtribute('');
                    setTipoDato('');
                }
            });
            selectedVertex.current = null;
        }
    }

    const deleteAtributo = () => {
        if (selectedVertex.current && atribute != '' && tipoDato != '') {
            const keys = Object.keys(clases);
            keys.forEach(async (key) => {
                const element = clases[key];
                if (selectedVertex.current.id == vID[element['claseID']].id) {
                    await DB.deleteAttribute(element['claseID'], atribute, tipoDato);     //Eliminar una clase
                    setAtribute('');
                    setTipoDato('');
                }
            });
            selectedVertex.current = null;
        }
    }

    const scriptSqlServer = () => {
        DB.sqlServer(parseInt(id), name);
    }

    const scriptPostgreSQL = () => {
        DB.postgreSQL(parseInt(id), name);
    }

    const handleDownload = () => {
        // Obtén el contenedor del grafo
        const container = graphContainerRef.current;

        // Convierte el contenedor en una imagen
        html2canvas(container)
            .then((canvas) => {
                // Convierte el lienzo en una imagen PNG
                const dataUrl = canvas.toDataURL('image/png');

                // Guarda la imagen como archivo
                saveAs(dataUrl, name + '.png');
            })
            .catch((error) => {
                console.error('Error al descargar la imagen:', error);
            });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                await getDiagramaById();
                await getClases();
                await getRelaciones();
            } catch (error) {
                console.log("Error al obtener el diagrama o las clases:", error);
            }
        };
        fetchData();
        initializePalette();
    }, []);

    useEffect(() => {
        createGraph();
    }, [clases, atribute, tipoDato, conection, nameRel, multiOrig, multiDest, edges]);

    return (
        <div>
            <div className='d-grid gap-2' style={{ marginTop: "-10px" }}>
                <button className='btn btn-success btn-lg mt-2 mb-2 text-white'>{name}</button>
            </div>
            <div id="palette" className="palette-container" style={{ display: "flex", marginTop: "-8px", flexWrap: "wrap", justifyContent: "space-between" }}>
                <div id="box1" className="palette-box" style={{
                    marginRight: "5px",
                    marginTop: "inherit",
                    marginBottom: "-5px",
                    border: "1px solid #ccc",
                    padding: "5px",
                    textAlign: "center",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: "bold"
                }}>
                    <p style={{ margin: "0" }}>+ class</p>
                    <img src='/icons/classIcon.png' alt="Class Icon" height="60" width="60" />
                </div>
                <div id="box2" className="palette-box" style={{
                    display: "flex",
                    alignItems: "center",
                    marginRight: "5px",
                    marginTop: "inherit",
                    marginBottom: "-5px",
                    border: "1px solid #ccc",
                    padding: "5px",
                    textAlign: "center",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: "bold"
                }}>
                    <div style={{ display: "flex", flexDirection: "column", marginLeft: "10px" }}>
                        <p style={{ margin: "0" }}>+- atributos</p>
                        <button style={{ border: "none", outline: "none" }} onClick={saveAtributo}>
                            <img src='/icons/saveIcon.png' alt="Class Icon" height="30" width="30" />
                        </button>
                        <button style={{ border: "none", outline: "none" }} onClick={deleteAtributo}>
                            <img src='/icons/deleteIcon.png' alt="Class Icon" height="30" width="30" />
                        </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", marginLeft: "10px" }}>
                        <input placeholder="Atributo..." style={{ width: "125px" }} className='form-control' onChange={(e) => setAtribute(e.target.value)}
                            type='text' value={atribute} />
                        <input placeholder="Tipo de dato..." style={{ width: "125px" }} className='form-control' onChange={(e) => setTipoDato(e.target.value)}
                            type='text' value={tipoDato} />
                    </div>
                </div>
                <div id="box3" className="palette-box" style={{
                    display: "flex",
                    alignItems: "center",
                    marginRight: "5px",
                    marginTop: "inherit",
                    marginBottom: "-5px",
                    border: "1px solid #ccc",
                    padding: "5px",
                    textAlign: "center",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: "bold"
                }}>
                    <div style={{ display: "flex", flexDirection: "column", marginLeft: "10px" }}>
                        <p style={{ margin: "0" }}>relacion actual:</p>
                        <input placeholder="Atributo..." style={{ width: "120px" }} className='form-control' onChange={(e) => setAtribute(e.target.value)}
                            type='text' value={conection} disabled />
                    </div>
                </div>
                <div id="box3" className="palette-box" style={{
                    display: "flex",
                    alignItems: "center",
                    marginRight: "5px",
                    marginTop: "inherit",
                    marginBottom: "-5px",
                    border: "1px solid #ccc",
                    padding: "5px",
                    textAlign: "center",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: "bold"
                }}>
                    <div style={{ display: "flex", flexDirection: "column", marginLeft: "10px" }}>
                        <p style={{ margin: "0" }}>nombre relación:</p>
                        <input placeholder="Nombre..." style={{ width: "100px" }} className='form-control' onChange={(e) => setNameRel(e.target.value)}
                            type='text' value={nameRel} />
                    </div>
                </div>
                <div id="box2" className="palette-box" style={{
                    display: "flex",
                    alignItems: "center",
                    marginRight: "5px",
                    marginTop: "inherit",
                    marginBottom: "-5px",
                    border: "1px solid #ccc",
                    padding: "5px",
                    textAlign: "center",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: "bold"
                }}>
                    <div style={{ display: "flex", flexDirection: "column", marginLeft: "10px" }}>
                        <input placeholder="Multi Orig.." style={{ width: "110px" }} className='form-control' onChange={(e) => setMultiOrig(e.target.value)}
                            type='text' value={multiOrig} />
                        <input placeholder="Multi Dest.." style={{ width: "110px" }} className='form-control' onChange={(e) => setMultiDest(e.target.value)}
                            type='text' value={multiDest} />
                    </div>
                </div>
                <div id="box4" className="palette-box" style={{
                    marginRight: "5px",
                    marginTop: "inherit",
                    marginBottom: "-5px",
                    border: "1px solid #ccc",
                    padding: "5px",
                    textAlign: "center",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: "bold"
                }}>
                    <p style={{ margin: "0" }}>  asociación</p>
                    <button onClick={() => setConection('Asociación')} style={{ border: "none", outline: "none" }}>
                        <img src='/icons/asociacionIcon.png' alt="Class Icon" height="60" width="60" />
                    </button>
                </div>
                <div id="box5" className="palette-box" style={{
                    marginRight: "5px",
                    marginTop: "inherit",
                    marginBottom: "-5px",
                    border: "1px solid #ccc",
                    padding: "5px",
                    textAlign: "center",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: "bold"
                }}>
                    <p style={{ margin: "0" }}>  agregación</p>
                    <button onClick={() => setConection('Agregación')} style={{
                        border: "none", outline: "none", display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        height: "75%",
                    }}>
                        <img src='/icons/agregacionIcon.png' alt="Class Icon" height="30" width="60" />
                    </button>
                </div>
                <div id="box6" className="palette-box" style={{
                    marginRight: "5px",
                    marginTop: "inherit",
                    marginBottom: "-5px",
                    border: "1px solid #ccc",
                    padding: "5px",
                    textAlign: "center",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: "bold"
                }}>
                    <p style={{ margin: "0" }}>  composición</p>
                    <button onClick={() => setConection('Composición')} style={{
                        border: "none", outline: "none", display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        height: "75%",
                    }}>
                        <img src='/icons/composicionIcon.png' alt="Class Icon" height="30" width="75" />
                    </button>
                </div>
                <div id="box7" className="palette-box" style={{
                    marginRight: "5px",
                    marginTop: "inherit",
                    marginBottom: "-5px",
                    border: "1px solid #ccc",
                    padding: "5px",
                    textAlign: "center",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: "bold"
                }}>
                    <p style={{ margin: "0" }}>  herencia</p>
                    <button onClick={() => setConection('Herencia')} style={{
                        border: "none", outline: "none", display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        height: "75%",
                    }}>
                        <img src='/icons/herenciaIcon.png' alt="Class Icon" height="30" width="60" />
                    </button>
                </div>
                <div id="box15" className="palette-box" style={{
                    marginRight: "5px",
                    marginTop: "inherit",
                    marginBottom: "-5px",
                    border: "1px solid #ccc",
                    padding: "5px",
                    textAlign: "center",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: "bold"
                }}>
                    <p style={{ margin: "0" }}>- eliminar</p>
                    <button onClick={handleDeleteVertex} style={{ border: "none", outline: "none" }}>
                        <img src='/icons/eliminarIcon.png' alt="Class Icon" height="60" width="60" />
                    </button>
                </div>
                <div id="box16" className="palette-box" style={{
                    marginRight: "5px",
                    marginTop: "inherit",
                    marginBottom: "-5px",
                    border: "1px solid #ccc",
                    padding: "5px",
                    textAlign: "center",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: "bold"
                }}>
                    <p style={{ margin: "0" }}>script</p>
                    <button onClick={scriptSqlServer} style={{ border: "none", outline: "none" }}>
                        <img src='/icons/sqlserver.png' alt="Class Icon" height="60" width="70" />
                    </button>
                </div>
                <div id="box17" className="palette-box" style={{
                    marginRight: "5px",
                    marginTop: "15px",
                    marginBottom: "-5px",
                    border: "1px solid #ccc",
                    padding: "5px",
                    textAlign: "center",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: "bold"
                }}>
                    <p style={{ margin: "0" }}>script</p>
                    <button onClick={scriptPostgreSQL} style={{ border: "none", outline: "none" }}>
                        <img src='/icons/postgresql.png' alt="Class Icon" height="60" width="70" />
                    </button>
                </div>
                <div id="box18" className="palette-box" style={{
                    marginRight: "5px",
                    marginTop: "15px",
                    marginBottom: "-5px",
                    border: "1px solid #ccc",
                    padding: "5px",
                    textAlign: "center",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "14px",
                    fontWeight: "bold"
                }}>
                    <p style={{ margin: "0" }}>download</p>
                    <button onClick={handleDownload} style={{ border: "none", outline: "none" }}>
                        <img src='/icons/image.png' alt="Class Icon" height="60" width="70" />
                    </button>
                </div>
            </div>
            <div ref={graphContainerRef} id="mxcontainer" style={{
                overflow: 'hidden', cursor: 'default',
                backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"%3E%3Crect width=\"100\" height=\"100\" fill=\"white\"/%3E%3Cpath d=\"M0 0h50v50H0zm50 50h50v50H50z\" fill=\"%23eaeaea\"/%3E%3C/svg%3E')",
            }}>
            </div>
        </div>
    );
};

export default MyMxGraph;