const express = require('express');
const { json, response } = require('express');
var http = require('https');
var querystring = require('querystring');
var request = require('request');
const { resolve } = require('path');

const app = express();
var PORTRESTAURANTE = 5000;
var PORTREPARTIDOR  = 5600;
var PORTCLIENTE     = 5800;
var PORTEBS         = 6000;

var pedidos = [];


async function simularEntregaPedidos(codigo)
{
    console.log('El pedido '+codigo+ ' ha sido recogido');
    var contador = 0;
    while(contador<6)
    {
        var resultado = await simularTiempoEntrega();
        console.log("El pedido "+codigo+" llegará en "+(30-(contador*5))+" minutos.");
        contador++;        
    }
    console.log("----------------------El pedido "+codigo+" ha sido entregado.-----------");
    pedidos.pop();
    actualizarEstado(codigo);
    notificarCliente(codigo);

}

function simularTiempoEntrega()
{
    return new Promise(resolve=>
        {
            setTimeout(() => {
                resolve(true);
            } , 2000 );
        
    });
}


/**
 * 
 * @param {*} codigo del pedido
 */
var actualizarEstado = function(codigo)
{
    var host = 'localhost';
    var port = PORTRESTAURANTE;
    var path = '/pedido/status/close/'+codigo;

    var options = 
    {
        uri: 'http://'+host+':'+port+path,        
        form:
        {
            codigo: codigo,            
        },
        body:    "codigo="+codigo
    };

    /*
    Ahora enviamos la petición post
     */    
    var req = request.get( options, (err, res, body)=>
    {
        if(err)
        {
            console.error('Peticion HTTP hacia el restaurante fallida\t'+err);
        }
        else
        {
            console.error('Peticion HTTP hacia el restaurante exitosa\t'+body);            
        }
    });

}




var notificarCliente = function(codigo)
{
    var host = 'localhost';
    var port = PORTCLIENTE;
    var path = '/pedido/notificacion/'+codigo;

    var options = 
    {
        uri: 'http://'+host+':'+port+path,        
        form:
        {
            codigo: codigo,            
        },
        body:    "codigo="+codigo
    };

    /*
    Ahora enviamos la petición post
     */    
    var req = request.get( options, (err, res, body)=>
    {
        if(err)
        {
            console.error('Peticion HTTP hacia el cliente fallida\t'+err);
        }
        else
        {
            console.error('Peticion HTTP hacia el cliente exitosa\t'+body);            
        }
    });

}


var entregar = function(codigo)
{
    var host = 'localhost';
    var port = PORTRESTAURANTE;
    var path = '/pedido/update';

    var options = 
    {
        uri: 'http://'+host+':'+port+path,  
        form:
        {
            codigo: codigo,            
        }
    };

    /*
    Ahora enviamos la petición post
     */    
    var req = request.post( options, (err, res, body)=>
    {
        if(err)
        {
            console.error('Peticion HTTP fallida\t'+err);
        }
        else
        {
            console.error('Peticion HTTP exitosa\t'+err);
            console.log(body);
        }
    });    
}



async function senGetRequest(PORT, PATH, VALUE)
{
    var retorno = invokeGet(PORT, PATH, VALUE);    
    return retorno;
}

function invokeGet(PORT, PATH, VALUE)
{
    var host = 'localhost';
    var port = PORT;
    var path = PATH+ VALUE;

    var options = 
    {
        uri: 'http://'+host+':'+port+path,        
        form:
        {
            codigo: VALUE,            
        },
        body:    "codigo="+VALUE
    };

    /*
    Ahora enviamos la petición post
     */    
    var response = null;
    var req = request.get( options, (err, res, body)=>
    {
        if(err)
        {
            console.error('Peticion HTTP hacia el restaurante fallida\t'+err);              
        }
        else
        {
            console.error('Peticion HTTP hacia el restaurante exitosa\t');                                    
        }                
        return res;
    });      
    return req;
}





/*ENDPOINTS */

/** 
 * Endpoints de microservicio cliente -------------------------------------
 */


 /**
  * Aquí se confirma el pedido y se desencadena su producción y su entrega. 
  * Codigo: Codigo del pedido que se comenzará. 
  */
 app.get('/pedido/:codigo', async (req, res)=>
 {
    var codigo = req.params.codigo;
    console.log('***********EBS: Redirigiendo petición de pedido al servicio cliente.***************');
    var rep = await senGetRequest(PORTRESTAURANTE, '/pedido/', codigo);       
    res.send('Su pedido ha sido enviado al restaurante.');
 });


/**
 * Aquí se confrima la entrega del pedido al cliente. 
 * Codigo: código del pedido entregado
 */

app.get('/cliene/notificacion/:codigo', async (req, res)=>
{
    var codigo = req.params.codigo;
    console.log('***********EBS: Redirigiendo petición de notificacion servicio cliente.***************');
    var rep = await senGetRequest(PORTCLIENTE, '/pedido/notificacion/', codigo);   
    var mensaje = "\n---------------------\nConfirmación de pedido " + codigo+ " recibido.\n---------------------\n";
    res.send(mensaje);
});


/**
 * Indicar al restaurante que se ha confirmado un pedido para él
 * Pedido: código del pedido
 */

app.get('/restaurante/pedido/:pedido', async (req, res)=>
{
    var codigo = req.params.pedido;
    console.log('***********EBS: Redirigiendo petición de notificacion de pedido al restaurante.***************');
    var rep = await senGetRequest(PORTRESTAURANTE, '/pedido/:pedido', codigo);   
    var mensaje = "\n---------------------\nConfirmación de pedido " + codigo+ " recibido.\n---------------------\n";
    res.send(mensaje);
});









//var path = '/pedido/recoger';
app.post('/pedido/recoger', (req, res)=>
{
    var codigo = req.params.codigo; 
    pedidos.push(codigo);
    var mensaje = '***********Se le ha notificado al repartidor que puede recoger el pedido. Código: '+codigo + '************';    
    console.log(mensaje);    
    console.log('Lista de pedidos\t'+pedidos);
    res.send(mensaje); 
    simularEntregaPedidos(codigo);
});




//app.listen(process.env.PORTRESTAURANTE, ()=>)
app.listen(PORTEBS,()=>
{
    console.log('Iniciando ESB. Puerto '+PORTEBS);
});