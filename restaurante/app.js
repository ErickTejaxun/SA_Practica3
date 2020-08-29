const express = require('express');
const { json } = require('express');
var http = require('https');
var querystring = require('querystring');
var request = require('request');

const app = express();
var PORTRESTAURANTE = 5000;
var PORTREPARTIDOR = 5500;
var pedidos = [];
var contadorPedido = 0;

/**
 * 
 * @param {*} codigo del pedido
 */
var avisarRepartidor = function(codigo)
{
    var host = 'localhost';
    var port = PORTREPARTIDOR;
    var path = '/pedido/recoger';

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


async function simularPreparacionPedido(codigo)
{

    var pedido = pedidos[0];
    Object.keys(pedidos).map((item)=>
    {
        var ped = pedidos[item];
        //console.log(ped.codigo +'=='+ idPedido);        
        if(ped.codigo == codigo)
        {
            pedido =   ped;                     
        }

    });

    console.log('El pedido '+pedido.codigo+ '. Estado: '+pedido.status);
    var contador = 0;
    while(contador<3)
    {
        var resultado = await simularTiempos();    
        pedido.actualizarStatus();  
        console.log('El pedido '+pedido.codigo+ '. Estado: '+pedido.status);  
        contador++;        
    }   
    avisarRepartidor(pedido.codigo);
}


function simularTiempos()
{
    return new Promise(resolve=>
        {
            setTimeout(() => {
                resolve(true);
            } , 2000 );
        
    });
}



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
            
            case 'En preparación':
                this.setEnviado();
            break;

            case 'Enviado, en camino':
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
        //avisarRepartidor(this.codigo);
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


var productos = 
[
    
    {
        "id": "PF001",
        "name": 'Spaguetti Cavatini',
        "price": 75.05
    }
    ,
    {
        "id": "PF002",
        "name": 'Rissotto con champiñones',
        "price": 44.99
    }
    ,
    {
        "id": "PF003",
        "name": 'Spaguetti a la boloñesa',
        "price": 47.75
    },
    {
        "id": "PF004",
        "name": 'Pizza de pepperoni Personal',
        "price": 52.75
    },
    {
        "id": "PF005",
        "name": 'Pizza Margarita Personal',
        "price": 52.75
    },
    {
        "id": "PF006",
        "name": 'Ravioles',
        "price": 49.99
    },
    {
        "id": "PF007",
        "name": 'Pollo a la parmigiana',
        "price": 37.05
    },
    {
        "id": "PF008",
        "name": 'Lasaña clásica',
        "price": 43.75
    },
    {
        "id": "BF701",
        "name": 'Pepsi Cola',        
        "presentation": 'Lata 355 ml',
        "price": 8.99        
    },
    {
        "id": "BF702",
        "name": 'Seven Up',        
        "presentation": 'Lata 355 ml',
        "price": 8.99        
    },
    {
        "id": "BF703",
        "name": 'Mirinda Naranja',
        "presentation": 'Lata 355 ml',
        "price": 8.99        
    },
    {
        "id": "BF704",
        "name": 'Coca Cola',
        "presentation": 'Lata 355 ml',
        "price": 8.99        
    },
    {
        "id": "BF705",
        "name": 'Cerveza Gallo',
        "presentation": 'Lata 355 ml',
        "price": 11.99        
    }            
];

var restaurantes = 
[
    {
        "codigo": 'GT001',
        "name": "Restaurante Nápoles",
        "address": 'Zona 10'
    },
    {
        "codigo": 'GT003',
        "name": "Pizzería Don Corleone",
        "address": 'Zona 12'
    },    
    {
        "codigo": 'GT005',
        "name": "Restaurante el dragón",
        "address": 'Zona 08'
    }    
];


app.get('/', (req,res) => 
{
    return res.send('Micro servicio Restaurantes');
});



app.get('/obtener/:id', (req, res)=>
{
    if(req.params.id =='all')
    {
        return res.json(restaurantes);
    }
    else
    {        
        return res.json(restaurantes[req.params.id]);
        //return res.json({"codigo":"No existe el código solicitado"});        
    }
    
});

app.get('/pedido/:pedido', (req, res)=>
{
    var pedido = req.params.pedido;
    console.log(pedido);
    if(pedido!=null)
    {
        pedidos.push(pedido);
        simularPreparacionPedido(pedido);
    }
    return res.json(restaurantes);
});

app.post('/pedido/status', (req,res)=>
{
    //var idPedido = req.params.codigo;
    var idPedido = contadorPedido;
    var pedido = pedidos[idPedido];
    var encontrado = false;
    //console.log(idPedido);

    Object.keys(pedidos).map((item)=>
    {
        var ped = pedidos[item];
        //console.log(ped.codigo +'=='+ idPedido);        
        if(ped.codigo == idPedido)
        {            
            ped.actualizarStatus();        
            console.log("Se ha actualizado el estado del pedido "+ped.codigo + ' al estado '+ped.status);
            encontrado = true;
            return res.json
            (
                {
                    "id":idPedido,
                    "status": pedido.status
                }
            );            
        }

    });

    if(!encontrado)
    {
        var mensaje = 'No se ha encontrado el pedido solicitado.';
        console.log(mensaje);
        return res.send(mensaje);
    }
});


app.get('/pedido/status/close/:codigo', (req,res)=>
{
    var mensaje = 'El pedido ' +req.params.codigo+' ha sido completado';
    console.log(mensaje);
    //res.send(mensaje);
});


app.post('/pedido/update', (req,res)=>
{
    var idPedido = req.params.id;
    
    var pedido = pedidos[idPedido];    
    if(pedido!=null)
    {
        pedido.actualizarStatus();
        pedido = pedidos[idPedido];    
        return res.json
        (
            {
                "id":idPedido,
                "status": pedido.status
            }
        );
    }
    return res.send('No se ha encontrado el pedido solicitado.');    
});



//app.listen(process.env.PORTRESTAURANTE, ()=>)
app.listen(PORTRESTAURANTE,()=>
{
    console.log('Iniciando micro servicio restuarante. En el puerto '+PORTRESTAURANTE );
});