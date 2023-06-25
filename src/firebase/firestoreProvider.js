import { toHaveFormValues } from "@testing-library/jest-dom/dist/matchers";
import { db } from "../firebase/firebaseConfig";
import { saveAs } from 'file-saver';
import { Timestamp, getDoc, collection, deleteDoc, getDocs, doc, setDoc, addDoc, onSnapshot, query, where, orderBy, updateDoc, arrayUnion, arrayRemove, limit, serverTimestamp } from "firebase/firestore";

const getClases = (id_diagrama, setClases) => {
    const q = query(collection(db, "clases"), where('id_diagrama', '==', parseInt(id_diagrama)), orderBy("timeStamp", "desc"));
    onSnapshot(q, async (querySnapshot) => {
        const items = [];
        querySnapshot.forEach((doc) => {
            items.push({ ...doc.data(), claseID: doc.id });
        });
        await setClases(items);
    });
}

const createClase = async (id_diagrama, nombre, x, y, height, width) => {
    const clase = {
        id_diagrama: parseInt(id_diagrama),
        nombre: nombre,
        x: x,
        y: y,
        height: height,
        width: width,
        timeStamp: serverTimestamp()
    };
    await addDoc(collection(db, "clases"), clase);
}

const updateClase = async (id_clase, clase) => {
    await updateDoc(doc(db, "clases", id_clase), clase);
}

const deleteClase = async (id_clase) => {
    await deleteDoc(doc(db, "clases", id_clase));
}

const getAtributos = (classID, newNode) => {
    const q = query(collection(db, "atributos"), where('classID', '==', classID));
    onSnapshot(q, async (querySnapshot) => {
        const i = 1;
        querySnapshot.forEach(async (doc) => {
            await newNode.setAttribute(doc.data().atributo, doc.data().tipoDato);
        });
    });
}

const createAttribute = async (classID, atributo, tipoDato) => {
    const attribute = {
        classID: classID,
        atributo: atributo,
        tipoDato: tipoDato,
        timeStamp: serverTimestamp()
    };
    await addDoc(collection(db, "atributos"), attribute);
}

const deleteAttribute = (classID, atributo, tipoDato) => {
    const q = query(collection(db, "atributos"), where('classID', '==', classID), where('atributo', '==', atributo), where('tipoDato', '==', tipoDato), limit(1));
    getDocs(q).then((snapshots) => {
        snapshots.forEach((doc) => {
            deleteDoc(doc.ref);
        });
    });
}

const createRelacion = async (id_diagrama, class_orig, class_dest, nombre, multi_orig, multi_dest, tipo_rel) => {
    const relacion = {
        id_diagrama: parseInt(id_diagrama),
        class_orig: class_orig,
        class_dest: class_dest,
        nombre: nombre,
        multi_orig: multi_orig,
        multi_dest: multi_dest,
        tipo_rel: tipo_rel,
        timeStamp: serverTimestamp()
    };
    await addDoc(collection(db, "relaciones"), relacion);
}

const getRelaciones = (id_diagrama, setEdges) => {
    const q = query(collection(db, "relaciones"), where('id_diagrama', '==', parseInt(id_diagrama)), orderBy("timeStamp", "desc"));
    onSnapshot(q, async (querySnapshot) => {
        const items = [];
        querySnapshot.forEach((doc) => {
            items.push({ ...doc.data(), relID: doc.id });
        });
        await setEdges(items);
    });
}

const createRelHerencia = async (id_diagrama, class_orig, class_dest, tipo_rel) => {
    const relacion = {
        id_diagrama: parseInt(id_diagrama),
        class_orig: class_orig,
        class_dest: class_dest,
        tipo_rel: tipo_rel,
        timeStamp: serverTimestamp()
    };
    await addDoc(collection(db, "relaciones"), relacion);
}

const deleteRelacion = async (id_rel) => {
    await deleteDoc(doc(db, "relaciones", id_rel));
}

const sqlServer = async (id_diagrama, name) => {
    const newName = name.split(' ').join('');
    let value = "create database " + newName + ";\n\n" + 'use ' + newName + ';\n\n';

    const qclases = query(collection(db, 'clases'), where('id_diagrama', '==', id_diagrama));
    let clasesFaltantes = [];
    await getDocs(qclases).then((clasSnapshots) => {
        clasSnapshots.forEach(doc => {
            clasesFaltantes.push({ ...doc.data(), id: doc.id });
        });
    });

    const qrel = query(collection(db, 'relaciones'), where('id_diagrama', '==', id_diagrama), where('tipo_rel', '==', 'Herencia'));
    let relacionesHerencia = [];
    await getDocs(qrel).then((relSnapshots) => {
        relSnapshots.forEach(doc => {
            relacionesHerencia.push({ ...doc.data(), id: doc.id });
        });
    });

    let newClass = clasesFaltantes;
    let tables = [];
    for (const element1 of relacionesHerencia) {
        for (const element2 of clasesFaltantes) {
            if (element1.class_dest === element2.id) {
                const foundObject = newClass.find(newClas => newClas.id === element1.class_dest);
                let table = "";
                if (foundObject) {
                    newClass = newClass.filter((newClas) => newClas.id !== element1.class_dest);
                    table += "create table " + element2.nombre + " ( \n";
                    //------------------------------
                    const q = query(collection(db, 'atributos'), where('classID', '==', element1.class_dest));
                    await getDocs(q).then((snapshots) => {
                        snapshots.forEach(doc => {
                            if (doc.data().tipoDato === 'varchar') {
                                table += doc.data().atributo + " " + doc.data().tipoDato + "(250)" + " not null,\n";
                            } else {
                                table += doc.data().atributo + " " + doc.data().tipoDato + " not null,\n";
                            }
                        });
                    });
                    //------------------------------
                    const q2 = query(collection(db, 'atributos'), where('classID', '==', element1.class_orig));
                    await getDocs(q2).then((snapshots) => {
                        snapshots.forEach(doc => {
                            if (doc.data().tipoDato === 'varchar') {
                                table += doc.data().atributo + " " + doc.data().tipoDato + "(250)" + ",\n";
                            } else {
                                table += doc.data().atributo + " " + doc.data().tipoDato + ",\n";
                            }
                        });
                    });
                    //-----------------------------
                    tables[element1.class_dest] = table;
                    const orig = newClass.find(newClas => newClas.id === element1.class_orig);
                    newClass = newClass.filter((newClas) => newClas.id !== element1.class_orig);
                    let newtable = "tipo_" + orig.nombre + " bit not null,\n";
                    tables[element1.class_orig] = newtable;
                } else {
                    //------------------------------
                    const q2 = query(collection(db, 'atributos'), where('classID', '==', element1.class_orig));
                    await getDocs(q2).then((snapshots) => {
                        snapshots.forEach(doc => {
                            if (doc.data().tipoDato === 'varchar') {
                                table += doc.data().atributo + " " + doc.data().tipoDato + "(250)" + ",\n";
                            } else {
                                table += doc.data().atributo + " " + doc.data().tipoDato + ",\n";
                            }
                        });
                    });
                    //-----------------------------
                    const orig = newClass.find(newClas => newClas.id === element1.class_orig);
                    newClass = newClass.filter((newClas) => newClas.id !== element1.class_orig);
                    table += "tipo_" + orig.nombre + " bit not null,\n";
                    tables[element1.class_orig] = table;
                }
            }
        };
    };
    const keys = Object.keys(tables);
    let i = 0;
    keys.forEach(key => {
        value += tables[key]
        i = i + 1;
        if (i === keys.length) {
            value += "primary key(id)\n);\n\n";
        }
    });

    tables = [];

    for (const element of newClass) {
        const q = query(collection(db, 'atributos'), where('classID', '==', element.id));
        let table = "";
        await getDocs(q).then((snapshots) => {
            if (snapshots.docs.length > 0) {
                table += "create table " + element.nombre + " ( \n";
            };
            snapshots.forEach(doc => {
                if (doc.data().tipoDato === 'varchar') {
                    table += doc.data().atributo + " " + doc.data().tipoDato + "(250)" + " not null,\n";
                } else {
                    table += doc.data().atributo + " " + doc.data().tipoDato + " not null,\n";
                }
            });
            if (snapshots.docs.length > 0) {
                table += "primary key(id)\n);\n\n";
            };
            tables.push(table);
        });
    }

    tables.forEach(table => {
        value += table;
    });

    const q = query(collection(db, 'relaciones'), where('id_diagrama', '==', id_diagrama), where('tipo_rel', '!=', 'Herencia'));
    let relaciones = [];
    await getDocs(q).then((relSnapshots) => {
        relSnapshots.forEach(doc => {
            relaciones.push({ ...doc.data(), id: doc.id });
        });
    });

    let rel = "";

    for (const element of relaciones) {
        const classO = clasesFaltantes.find(claseFaltante => claseFaltante.id === element.class_orig);
        const classD = clasesFaltantes.find(claseFaltante => claseFaltante.id === element.class_dest);
        if (element.multi_orig.includes('*') && element.multi_dest.includes('*')) {

        } else {
            if (element.multi_orig.includes('*')) {
                rel += "alter table " + classO.nombre + "\nadd id_" + classD.nombre +
                    " int not null;\n\nalter table " + classO.nombre + "\nadd constraint fk_" +
                    classO.nombre + "_" + classD.nombre + "\nforeign key (id_" + classD.nombre +
                    ") references " + classD.nombre + "(id);\n\n";
            } else {
                if (element.multi_dest.includes('*')) {
                    rel += "alter table " + classD.nombre + "\nadd id_" + classO.nombre +
                        " int not null;\n\nalter table " + classD.nombre + "\nadd constraint fk_" +
                        classD.nombre + "_" + classO.nombre + "\nforeign key (id_" + classO.nombre +
                        ") references " + classO.nombre + "(id);\n\n";
                }
            }
        }
        if (!element.multi_orig.includes('*') && !element.multi_dest.includes('*') &&
            element.multi_orig === element.multi_dest) {
            rel += "alter table " + classO.nombre + "\nadd id_" + classD.nombre +
                " int not null;\n\nalter table " + classO.nombre + "\nadd constraint fk_" +
                classO.nombre + "_" + classD.nombre + "\nforeign key (id_" + classD.nombre +
                ") references " + classD.nombre + "(id);\n\n";
        } else {
            if (element.multi_orig === "0..1" && element.multi_dest === "1") {
                rel += "alter table " + classO.nombre + "\nadd id_" + classD.nombre +
                    " int not null;\n\nalter table " + classO.nombre + "\nadd constraint fk_" +
                    classO.nombre + "_" + classD.nombre + "\nforeign key (id_" + classD.nombre +
                    ") references " + classD.nombre + "(id);\n\n";
            } else {
                if (element.multi_dest === "0..1" && element.multi_orig === "1") {
                    rel += "alter table " + classD.nombre + "\nadd id_" + classO.nombre +
                        " int not null;\n\nalter table " + classD.nombre + "\nadd constraint fk_" +
                        classD.nombre + "_" + classO.nombre + "\nforeign key (id_" + classO.nombre +
                        ") references " + classO.nombre + "(id);\n\n";
                }
            }
        }
    }

    value += rel;

    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, newName + '-sqlsrv.sql');
}

const postgreSQL = async (id_diagrama, name) => {
    const newName = name.split(' ').join('');
    let value = "create database " + newName + ";\n\n";

    const qclases = query(collection(db, 'clases'), where('id_diagrama', '==', id_diagrama));
    let clasesFaltantes = [];
    await getDocs(qclases).then((clasSnapshots) => {
        clasSnapshots.forEach(doc => {
            clasesFaltantes.push({ ...doc.data(), id: doc.id });
        });
    });

    const qrel = query(collection(db, 'relaciones'), where('id_diagrama', '==', id_diagrama), where('tipo_rel', '==', 'Herencia'));
    let relacionesHerencia = [];
    await getDocs(qrel).then((relSnapshots) => {
        relSnapshots.forEach(doc => {
            relacionesHerencia.push({ ...doc.data(), id: doc.id });
        });
    });

    let newClass = clasesFaltantes;
    let tables = [];
    for (const element1 of relacionesHerencia) {
        for (const element2 of clasesFaltantes) {
            if (element1.class_dest === element2.id) {
                const foundObject = newClass.find(newClas => newClas.id === element1.class_dest);
                let table = "";
                if (foundObject) {
                    newClass = newClass.filter((newClas) => newClas.id !== element1.class_dest);
                    table += "create table " + element2.nombre + " ( \n";
                    //------------------------------
                    const q = query(collection(db, 'atributos'), where('classID', '==', element1.class_dest));
                    await getDocs(q).then((snapshots) => {
                        snapshots.forEach(doc => {
                            if (doc.data().tipoDato === 'varchar') {
                                table += doc.data().atributo + " " + doc.data().tipoDato + "(250)" + " not null,\n";
                            } else {
                                table += doc.data().atributo + " " + doc.data().tipoDato + " not null,\n";
                            }
                        });
                    });
                    //------------------------------
                    const q2 = query(collection(db, 'atributos'), where('classID', '==', element1.class_orig));
                    await getDocs(q2).then((snapshots) => {
                        snapshots.forEach(doc => {
                            if (doc.data().tipoDato === 'varchar') {
                                table += doc.data().atributo + " " + doc.data().tipoDato + "(250)" + ",\n";
                            } else {
                                table += doc.data().atributo + " " + doc.data().tipoDato + ",\n";
                            }
                        });
                    });
                    //-----------------------------
                    /*tables[element1.class_dest] = table;
                    const orig = newClass.find(newClas => newClas.id === element1.class_orig);
                    newClass = newClass.filter((newClas) => newClas.id !== element1.class_orig);
                    let newtable = "tipo_" + orig.nombre + " bit not null,\n";
                    tables[element1.class_orig] = newtable;*/
                } else {
                    //------------------------------
                    const q2 = query(collection(db, 'atributos'), where('classID', '==', element1.class_orig));
                    await getDocs(q2).then((snapshots) => {
                        snapshots.forEach(doc => {
                            if (doc.data().tipoDato === 'varchar') {
                                table += doc.data().atributo + " " + doc.data().tipoDato + "(250)" + ",\n";
                            } else {
                                table += doc.data().atributo + " " + doc.data().tipoDato + ",\n";
                            }
                        });
                    });
                    //-----------------------------
                    /*const orig = newClass.find(newClas => newClas.id === element1.class_orig);
                    newClass = newClass.filter((newClas) => newClas.id !== element1.class_orig);
                    table += "tipo_" + orig.nombre + " bit not null,\n";
                    tables[element1.class_orig] = table;*/
                }
            }
        };
    };
    const keys = Object.keys(tables);
    let i = 0;
    keys.forEach(key => {
        value += tables[key]
        i = i + 1;
        if (i === keys.length) {
            value += "primary key(id)\n);\n\n";
        }
    });

    tables = [];

    for (const element of newClass) {
        const q = query(collection(db, 'atributos'), where('classID', '==', element.id));
        let table = "";
        await getDocs(q).then((snapshots) => {
            if (snapshots.docs.length > 0) {
                table += "create table " + element.nombre + " ( \n";
            };
            snapshots.forEach(doc => {
                if (doc.data().tipoDato === 'varchar') {
                    table += doc.data().atributo + " " + doc.data().tipoDato + "(250)" + " not null,\n";
                } else {
                    table += doc.data().atributo + " " + doc.data().tipoDato + " not null,\n";
                }
            });
            if (snapshots.docs.length > 0) {
                table += "primary key(id)\n);\n\n";
            };
            tables.push(table);
        });
    }

    tables.forEach(table => {
        value += table;
    });

    const q = query(collection(db, 'relaciones'), where('id_diagrama', '==', id_diagrama), where('tipo_rel', '!=', 'Herencia'));
    let relaciones = [];
    await getDocs(q).then((relSnapshots) => {
        relSnapshots.forEach(doc => {
            relaciones.push({ ...doc.data(), id: doc.id });
        });
    });

    let rel = "";

    for (const element of relaciones) {
        const classO = clasesFaltantes.find(claseFaltante => claseFaltante.id === element.class_orig);
        const classD = clasesFaltantes.find(claseFaltante => claseFaltante.id === element.class_dest);
        if (element.multi_orig.includes('*') && element.multi_dest.includes('*')) {

        } else {
            if (element.multi_orig.includes('*')) {
                rel += "alter table " + classO.nombre + "\nadd id_" + classD.nombre +
                    " int not null;\n\nalter table " + classO.nombre + "\nadd constraint fk_" +
                    classO.nombre + "_" + classD.nombre + "\nforeign key (id_" + classD.nombre +
                    ") references " + classD.nombre + "(id);\n\n";
            } else {
                if (element.multi_dest.includes('*')) {
                    rel += "alter table " + classD.nombre + "\nadd id_" + classO.nombre +
                        " int not null;\n\nalter table " + classD.nombre + "\nadd constraint fk_" +
                        classD.nombre + "_" + classO.nombre + "\nforeign key (id_" + classO.nombre +
                        ") references " + classO.nombre + "(id);\n\n";
                }
            }
        }
        if (!element.multi_orig.includes('*') && !element.multi_dest.includes('*') &&
            element.multi_orig === element.multi_dest) {
            rel += "alter table " + classO.nombre + "\nadd id_" + classD.nombre +
                " int not null;\n\nalter table " + classO.nombre + "\nadd constraint fk_" +
                classO.nombre + "_" + classD.nombre + "\nforeign key (id_" + classD.nombre +
                ") references " + classD.nombre + "(id);\n\n";
        } else {
            if (element.multi_orig === "0..1" && element.multi_dest === "1") {
                rel += "alter table " + classO.nombre + "\nadd id_" + classD.nombre +
                    " int not null;\n\nalter table " + classO.nombre + "\nadd constraint fk_" +
                    classO.nombre + "_" + classD.nombre + "\nforeign key (id_" + classD.nombre +
                    ") references " + classD.nombre + "(id);\n\n";
            } else {
                if (element.multi_dest === "0..1" && element.multi_orig === "1") {
                    rel += "alter table " + classD.nombre + "\nadd id_" + classO.nombre +
                        " int not null;\n\nalter table " + classD.nombre + "\nadd constraint fk_" +
                        classD.nombre + "_" + classO.nombre + "\nforeign key (id_" + classO.nombre +
                        ") references " + classO.nombre + "(id);\n\n";
                }
            }
        }
    }

    value += rel;

    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, newName + '-pgsql.sql');
}

const DB = {
    getClases,
    updateClase,
    createClase,
    deleteClase,
    getAtributos,
    createAttribute,
    deleteAttribute,
    getRelaciones,
    createRelacion,
    createRelHerencia,
    deleteRelacion,
    sqlServer,
    postgreSQL
};

export default DB;