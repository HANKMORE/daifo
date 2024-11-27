const { Pool } = require('pg');

const pool = new Pool({
    connectionString:'postgres://postgresql://daifotelecomprueba_enqw_user:gJkAYmifWhk99j5fWze9qTVIo86kcdoX@dpg-ct37rj5umphs73dpf7ug-a/daifotelecomprueba_enqw'
});

const getUsers = async (req, res) => {
    const response = await pool.query('SELECT * FROM appweb_empleado');
    res.status(200).json(response.rows);
};

const createUser = async (req, res) => {
    const { correo, apellido, contrasena, especialidad, nombre, telefono } = req.body;
    const response = await pool.query(
        'INSERT INTO appweb_empleado (correo, apellido, contrasena, especialidad, nombre, telefono) VALUES ($1, $2, $3, $4, $5, $6)', 
        [correo, apellido, contrasena, especialidad, nombre, telefono]
    );
    console.log(response);
    res.json({
        message: 'Usuario Agregado Satisfactoriamente',
        body: {
            user: { correo, contrasena }
        }
    });
};

const loginUser = async (req, res) => {
    const { correo, contrasena } = req.body;

    try {
        const response = await pool.query(
            'SELECT * FROM appweb_empleado WHERE correo = $1 AND contrasena = $2', 
            [correo, contrasena]
        );

        if (response.rows.length > 0) {
            const user = response.rows[0];
            res.status(200).json({
                message: 'Login exitoso', 
                especialidad: user.especialidad // Devolver especialidad del usuario
            });
        } else {
            res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al autenticar usuario' });
    }
};

const getClients = async (req, res) => {
    try {
        const response = await pool.query(`
            SELECT 
                c.cliente_id, 
                c.codigo_cliente, 
                c.nombre, 
                c.apellido, 
                c.telefono, 
                c.direccion, 
                c.lat, 
                c.lng, 
                COALESCE(v.resultado_evaluacion, 'Sin puntuación') AS ultima_puntuacion
            FROM appweb_cliente c
            LEFT JOIN LATERAL (
                SELECT resultado_evaluacion
                FROM appweb_visitatecnica 
                WHERE appweb_visitatecnica.cliente_id = c.cliente_id
                ORDER BY fecha_visita DESC 
                LIMIT 1
            ) v ON true
        `);

        res.status(200).json(response.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los clientes.' });
    }
};



const getVisitHistory = async (req, res) => {
    const { cliente_id } = req.params; // Obtener el cliente_id desde los parámetros de la URL

    try {
        const response = await pool.query(
            `SELECT v.visita_id, v.fecha_visita, v.hora_visita, v.descripcion, v.resultado_evaluacion, v.tiempo_finalizacion
            FROM appweb_visitatecnica v
            WHERE v.cliente_id = $1
            ORDER BY v.fecha_visita DESC`, 
            [cliente_id]
        );

        if (response.rows.length > 0) {
            res.status(200).json(response.rows);
        } else {
            res.status(404).json({ message: 'No se encontraron visitas para este cliente' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el historial de visitas' });
    }
};

const getClientDetails = async (req, res) => {
    const { cliente_id } = req.params; // Obtener el cliente_id desde los parámetros de la URL

    try {
        // 1. Obtener la información básica del cliente
        const clientResponse = await pool.query(
            'SELECT * FROM appweb_cliente WHERE cliente_id = $1',
            [cliente_id]
        );

        if (clientResponse.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        const client = clientResponse.rows[0];

        // 2. Obtener la última visita registrada
        const lastVisitResponse = await pool.query(
            `SELECT * 
             FROM appweb_visitatecnica 
             WHERE cliente_id = $1 
             ORDER BY fecha_visita DESC 
             LIMIT 1`,
            [cliente_id]
        );

        const lastVisit = lastVisitResponse.rows[0] || null;

        // 3. Obtener el historial completo de visitas
        const visitHistoryResponse = await pool.query(
            `SELECT * 
             FROM appweb_visitatecnica 
             WHERE cliente_id = $1 
             ORDER BY fecha_visita DESC`,
            [cliente_id]
        );

        const visitHistory = visitHistoryResponse.rows;

        // Responder con todos los datos combinados
        res.status(200).json({
            client,
            lastVisit,
            visitHistory,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los detalles del cliente.' });
    }
};
// Consultar el historial de visitas de un cliente específico
const getVisitHistoryByClientId = async (req, res) => {
    const { cliente_id } = req.params; // Obtener el cliente_id desde los parámetros de la URL

    try {
        // Realizamos la consulta para obtener el historial de visitas del cliente
        const response = await pool.query(
            `SELECT v.visita_id, 
                    v.fecha_visita, 
                    v.hora_visita, 
                    v.descripcion, 
                    v.resultado_evaluacion, 
                    v.tiempo_finalizacion
            FROM appweb_visitatecnica v
            WHERE v.cliente_id = $1
            ORDER BY v.fecha_visita DESC`, 
            [cliente_id]  // Pasamos el cliente_id como parámetro
        );

        // Si hay resultados, los enviamos
        if (response.rows.length > 0) {
            res.status(200).json({
                message: 'Historial de visitas encontrado',
                visits: response.rows  // Retornamos las visitas encontradas
            });
        } else {
            // Si no hay visitas, enviamos un mensaje indicando que no se encontraron registros
            res.status(404).json({ message: 'No se encontraron visitas para este cliente' });
        }
    } catch (error) {
        // Si ocurre un error, lo logueamos y enviamos un mensaje de error
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el historial de visitas' });
    }
};

module.exports = {
    getUsers,
    createUser,
    loginUser,
    getClients,
    getVisitHistory,
    getClientDetails, 
    getVisitHistoryByClientId,// Exportar el nuevo endpoint
};

