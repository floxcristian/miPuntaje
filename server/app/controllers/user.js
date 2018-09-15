'use strict'

const bcrypt = require('bcrypt-nodejs');
//const jwt = require('../services/jwt');
const pool = require('../database/pool');
//const User = require('../models/user');

//const valid_roles = {};

async function getUsers(req, res) {
    try {
        const {
            rows
        } = await pool.query('SELECT id_user, name, last_name, middle_name, document_no, email, phone_no, username, active, profile_image, created_at, updated_at FROM users');
        res.json({
            user_payload: req.user_payload,
            users: rows
        })
    } catch (error) {
        res.status(500).json({
            message: 'error in obtaining users',
            error
        });
    }
}

async function getUserByUserId(req, res) {
    try {
        var id_user = req.params.userId;
        const {
            rows
        } = await pool.query('SELECT id_user, name, last_name, middle_name, document_no, email, phone_no, username, active, profile_image, created_at, updated_at FROM users WHERE id_user = $1', [id_user]);
        res.json(rows)
    } catch (error) {
        res.status(500).json({
            message: 'error in obtaining users',
            error
        });
    }
}

async function createUser(req, res) {

    try {
        const {
            name,
            last_name,
            middle_name,
            document_no,
            email,
            phone_no,
            username,
            profile_image,
            password
        } = req.body;

        if (name && last_name && middle_name && document_no && email && phone_no && username && password) {
            //COMPRUEBO QUE EL RUT,USERNAME E EMAIL NO EXISTAN  EN LA BASE DE DATOS user.rut.toLowerCase()
            const result_search = await Promise.all([
                pool.query('SELECT id_user FROM users WHERE document_no = $1', [document_no.toUpperCase()]),
                pool.query('SELECT id_user FROM users WHERE username = $1', [username.toLowerCase()]),
                pool.query('SELECT id_user FROM users WHERE email = $1', [email.toLowerCase()]),
            ]);

            const rows_document_no = result_search[0].rows;
            const rows_username = result_search[1].rows;
            const rows_email = result_search[2].rows;
            let combination = `${rows_document_no.length}${rows_username.length}${rows_email.length}`;

            switch (combination) {
                case '111':
                    return res.status(500).json({
                        status: '111',
                        message: `this document_no, username and email has been taken`
                    })
                case '110':
                    return res.status(500).json({
                        status: '110',
                        message: `this document_no and username has been taken`
                    })
                case '101':
                    return res.status(500).json({
                        status: '101',
                        message: `this document_no and email has been taken`
                    })
                case '011':
                    return res.status(500).json({
                        status: '011',
                        message: `this username and email has been taken`
                    })
                case '100':
                    return res.status(500).json({
                        status: '100',
                        message: `this document_no has been taken`
                    })
                case '010':
                    return res.status(500).json({
                        status: '010',
                        message: `this username has been taken`
                    })
                case '001':
                    return res.status(500).json({
                        status: '001',
                        message: `this email has been taken`
                    })
                default:
                    let salt = bcrypt.genSaltSync(10);
                    const text = 'INSERT INTO users(name, last_name, middle_name, document_no, email, phone_no, username, password) VALUES($1, $2, $3, $4, $5, $6, $7, $8)  RETURNING id_user';
                    const values = [name, last_name, middle_name, document_no, email, phone_no, username, bcrypt.hashSync(password, salt)];
                    const {
                        rows
                    } = await pool.query(text, values);
                    const roles = await pool.query('INSERT INTO user_role(id_user, id_role) VALUES($1, $2)', [rows[0].id_user, '3']);
                    //GENERO EL TOKEN CON DATOS DE USUARIO Y ROLES
                    res.json({
                        message: 'successfully created user'
                    })
            }
        } else {
            res.status(400).send({
                message: 'send all necessary fields'
            })
        }
    } catch (error) {
        console.log(`${error}`)
        res.status(500).json({
            message: 'error when saving the user',
            error
        })
    }
}

//SOLO PUEDE MODIFICAR USUARIO QUE VIENE EN SU TOKEN
async function updateUser(req, res) {
    try {
        const id_user = req.params.userId;
        const {
            name,
            last_name,
            middle_name,
            document_no,
            email,
            phone_no,
            username,
            active,
            profile_image,
            password
        } = req.body;

        //BUSCA Y ACTUALIZA EN LA MISMA QUERY
        if (id_user != req.user_payload.id_user) {
            return res.status(500) - json({
                success: false,
                message: 'you do not have permission to update user data'
            })
        }
        const text = 'UPDATE users SET name = $1, last_name = $2, middle_name = $3, document_no = $4, email = $5, phone_no = $6, username = $7, active = $8 WHERE id_user = $9';
        const values = [name, last_name, middle_name, document_no, email, phone_no, username, active, id_user];
        const {
            rows
        } = await pool.query(text, values);

        /*
                res.status(200).send({
                    color: rows
                });*/
    } catch (error) {
        console.log(`database ${error}`)
        res.json({
            success: false,
            error
        });
    }
}

async function deleteUser(req, res) {
    try {
        const id_user = req.params.userId;
        const {
            rows
        } = await pool.query('DELETE FROM users WHERE id_user = $1', [id_user]);
        res.json({
            message: 'successfully deleted user'
        });
    } catch (error) {
        console.log(`database ${error}`)
        res.json({
            success: false,
            error
        });
    }
}

async function disableUser(req, res) {
    try {
        const id_user = req.params.userId;
        const {
            rows
        } = await pool.query('UPDATE users SET active = false WHERE id_user = $1', [id_user]);
        res.json({
            message: 'successfully disabled user'
        });
    } catch (error) {
        console.log(`database ${error}`)
        res.json({
            success: false,
            error
        });
    }
}
// function login(req, res) {
//     var params = req.body;

//     var rut = params.rut;
//     var password = params.password;

//     //COMPROBAR SI EL RUT Y LA CONTRASEÑA QUE ME ESTAN ENVIANDO COINCIDEN CON ALGUNA EN LA BASE DE DATOS
//     if (user) {
//         //bcrypt.compare() password que le paso y password almacenada en al db
//     }

// }

// function logout(req, res) {
//     var params = req.body;
// }


async function getStudentsByCourse() {

}
module.exports = {
    getUsers,
    getUserByUserId,
    createUser,
    updateUser,
    deleteUser,
    disableUser
}