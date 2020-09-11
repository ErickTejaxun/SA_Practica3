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
var CONT =0;
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



async function senPostRequest(PORT, PATH, VALUE)
{
    var retorno = invokePost(PORT, PATH, VALUE);    
    return retorno;
}


function invokePost(PORT, PATH, VALUE)
{
    var host = 'localhost';
    var port = PORT;
    var path = PATH;

    var options = 
    {
        uri: 'http://'+host+':'+port+path,        
        form:
        {
            codigo: VALUE,            
            id: VALUE,  
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
            console.error('Peticion HTTP exitosa\t');            
        }
    });
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
    console.log('1)***********EBS: Redirigiendo petición de pedido al servicio cliente.***************');
    var rep =  senGetRequest(PORTCLIENTE, '/pedido/', codigo);       
    res.send('Su pedido ha sido enviado al restaurante.');
 });


/**
 * Aquí se confrima la entrega del pedido al cliente. 
 * Codigo: código del pedido entregado
 */

app.get('/cliente/notificacion/:codigo', async (req, res)=>
{
    var codigo = req.params.codigo;
    console.log('5)***********EBS: Redirigiendo petición de notificacion servicio cliente.***************');
    var rep =  senGetRequest(PORTCLIENTE, '/pedido/notificacion/', codigo);   
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
    console.log('2)***********EBS: Redirigiendo petición de notificacion de pedido al restaurante.***************');
    var rep =  senGetRequest(PORTRESTAURANTE, '/pedido/', codigo);   
    var mensaje = "\n---------------------\nConfirmación de pedido " + codigo+ " enviado al restaurante.\n---------------------\n";
    res.send(mensaje);
});

/**
 * Indica al delivery que puede recoger el pedido en el restaurante
 * Codigo: Codigo del pedido a recoger
 */

app.post('/repartidor/pedido/recoger', async (req, res)=>
{
    var codigo = req.params.codigo;
    console.log('3)***********EBS: Redirigiendo petición de notificacion de recoger pedido al repartidor.***************');
    var rep =  senPostRequest(PORTREPARTIDOR, '/pedido/recoger', codigo);   
    var mensaje = "\n---------------------\nConfirmación de notificación del pedido  " + codigo+ " al repartidor.\n---------------------\n";
    res.send(mensaje);
});


app.get('/restaurante/pedido/status/close/:codigo', async (req,res)=>
{
    var codigo = req.params.codigo;
    console.log('4)***********EBS: Redirigiendo petición de notificacion de entrega al restaurante.***************');
    var rep =  senGetRequest(PORTRESTAURANTE, '/pedido/status/close/', codigo);   
    var mensaje = "\n---------------------\nConfirmación de entrega de confirmación de entrega del pedido  " + codigo+ " al restaurante.\n---------------------\n";
    res.send(mensaje);    
});



//app.listen(process.env.PORTRESTAURANTE, ()=>)
app.listen(PORTEBS,()=>
{
    console.log('Iniciando ESB. Puerto '+PORTEBS);
});