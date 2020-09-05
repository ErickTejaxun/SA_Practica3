const express = require('express');
const { json } = require('express');
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






class pedido
{
    constructor(codigoUsuario, codigo)
    {
        this.codigoUsuario = codigoUsuario;
        this.detalle = [];
        this.date =  Date.now();
        this.status = 'En espera';
        this.codigo = codigo;
    }

    actualizarStatus()
    {
        switch(this.status)
        {
            case 'En espera':
                this.setPreparando();
            break;
            
            case 'En preparacion':
                this.setEnviado();
            break;

            case 'En preparacion':
                this.setEntregado();
            break;
        }
    }


    setPreparando()
    { 
        this.status ='En preparación';
    }

    setEnviado()
    {
        this.status = 'Enviado, en camino';
        avisarRepartidor(this.codigo);
    }

    setEntregado()
    {
        this.status = 'Entregado';
    }

    //Agregar detalle
    addDetail(detail)
    {
        this.detalle.push(detail);
    }
}

class Detalle
{
    constructor(codeProd, cant)
    {
        this.codigo = codeProd;
        this.cantidad = cant;
    }
}

var pedidoInicial = new pedido('PD001',0);
pedidoInicial.addDetail(new Detalle('BD001',20));

var pedido2 = new pedido('PD002',1);
pedido2.addDetail(new Detalle('BD002',20));
pedidos.push(pedidoInicial);
pedidos.push(pedido2);









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
    var path = '/pedido/status';

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
    var req = request.post( options, (err, res, body)=>
    {
        if(err)
        {
            console.error('Peticion HTTP fallida\t'+err);
        }
        else
        {
            console.error('Peticion HTTP exitosa\t'+body);            
        }
    });

}









var enviarPedidoRestaurante = function(codigo)
{
    var host = 'localhost';
    var port = PORTEBS;
    var path = '/restaurante/pedido/'+codigo;

    var options = 
    {
        uri: 'http://'+host+':'+port+path,  
        form:
        {
            codigo: codigo,            
            id: codigo,  
        }
    };

    /*
    Ahora enviamos la petición post
     */    
    var req = request.get( options, (err, res, body)=>
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


app.get('/pedido/:codigo', (req, res)=>
{
    var codigo = req.params.codigo;
    enviarPedidoRestaurante(codigo);
    var mensaje = "Se ha comenzado su pedido\n";
    console.log(mensaje);
    res.send(mensaje);
});


app.get('/pedido/notificacion/:codigo', (req, res)=>
{
    var codigo = req.params.codigo;
    //enviarPedidoRestaurante(codigo);
    var mensaje = "\n---------------------\nConfirmación de pedido " + codigo+ " recibido.\n---------------------\n";
    console.log(mensaje);
    res.send(mensaje);
});



//app.listen(process.env.PORTRESTAURANTE, ()=>)
app.listen(PORTCLIENTE,()=>
{
    console.log('Iniciando micro servicio Cliente. Puerto '+PORTCLIENTE);
});