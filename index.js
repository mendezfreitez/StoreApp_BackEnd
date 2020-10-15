const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const SaltRounds = 10;
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const puerto = 3000;


app.use(session({ 
  secret:'secreto',
  resave:false,
  saveUninitialized:false
}));
app.use(cors());
app.use(express.json({limit: '50mb', extended: true}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

mongoose.connect(`mongodb://localhost:27017/storeDB`, {useNewUrlParser: true, useUnifiedTopology: true}, function(err){
  if(err){ console.log(`Ocurrio un error al intentar conectar con la BD.`); }
  else{ console.log(`Conectado a mongoDB.`); }
});

const productoEsquema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  categoria:String,
  precio: Number,
  cantidad: Number,
  nombreImagenes:Array,
  dataImagenes:Array
}); 
const usuarioEsquema = new mongoose.Schema({
  usuario: String,
  contrasenia: String,
  carro: Array
});
const cateoriaEsquema = new mongoose.Schema({
  nombre:String
})

const unProducto = mongoose.model('productos', productoEsquema);
const unUsuario = mongoose.model('usuarios', usuarioEsquema);
const unaCategoria = mongoose.model('categorias', cateoriaEsquema);

app.get('/', function (req, res) {
  res.send('Bienvenido Daniel');
  console.log(`Escuchando el puerto ${puerto}`);
});
app.get('/Admin', function (req, res) {
  console.log(session.user);
  res.send('Administrador de producto');
});
app.post('/traerUnProducto', function (req, res) {
  unProducto.find({ '_id': req.body.id }, function (error, result) {
    if (result) {
      // console.log(result);
      res.send(result);
    }
  });
})
app.post('/traerTodos', function (req, res) {
  // console.log(req.body);
  if (req.body.id === '') {
    unProducto.find(function(err, result){
      if(err){
        res.send(err);
      }
      else{
        res.send(result);
      }
    });
  }
  else {
    unProducto.find({categoria:req.body.id},function (err, result) {
      if (err) {
        res.send(err);
      } else {
        res.send(result);
      }
    });
  }
});
app.post('/Registro', function(req, res){
  bcrypt.hash(req.body.contrasenia, SaltRounds)
  .then(function(hashedPassword) {
    unUsuario.create({'usuario':req.body.usuario,'contrasenia':hashedPassword});
    res.send("1");
  })
  .then(function() {
    res.send();
  })
  .catch(function(error){
      console.log("Error saving user: ");
      console.log(error);
      next();
  });
});
app.post('/NuevoProducto', function (req, res) {
  console.log(req.body.idProducto);
  if (req.body.idProducto === '') {
    unProducto.create({
    nombre: req.body.nombre,
    descripcion: req.body.descripcion,
    categoria: req.body.categoria,
    precio: req.body.precio,
    cantidad: req.body.cantidad,
    nombreImagenes:req.body.nombreImags,
    dataImagenes:req.body.dataImags
    }, function(err){
      if(!err){
        res.send(`Producto "${req.body.nombre}" guardado en stock!`);
      }
      else{
        res.send(`Error al almacenar producto!`);
        console.log(err);
      }
    });  
  }
  else {
    unProducto.findByIdAndUpdate(
      { _id: req.body.idProducto },
      {
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        categoria: req.body.categoria,
        precio: req.body.precio,
        cantidad: req.body.cantidad,
        nombreImagenes: req.body.nombreImags,
        dataImagenes: req.body.dataImags,
      },
      function (error) {
        if (!error) {
          res.send("Edición guardada con éxito")
        } else {
          res.send(`Error al guardar edición.`)
        }
      }
    );
  }

});
app.post(`/eliminarProducto`, function (req, res) {
  console.log(req.body);
  unProducto.deleteOne({ _id: req.body._id }, function (err) {
    if (!err) {
      res.send(`Producto eliminado con éxito.`);
    } else {
      res.send("Error al eliminar Producto.");
    }
  });
});
app.post('/Acceso', function(req, res){
    unUsuario.find({'usuario':req.body.usuario}, function(error, result){
      if(result.length > 0){
        bcrypt.compare(req.body.contrasenia, result[0].contrasenia, function(err, resul) {
          // if(!err){
            session.user = result[0].usuario
            console.log(session.user)
            res.send({'resul':resul, 'usuario':result})
          // }
        });
        // console.log(result[0].contrasenia);
      }
      else{
        res.send(`El usuario '${req.body.usuario}' no se encuentra registrado.`);
      }
    });
});
app.post('/disponibleUsuario', function(req, res){
  unUsuario.find({'usuario':req.body.usuario}, function(error, result){
    if(result.length > 0){
      res.send(`0`)
    }
    else{
      res.send(`1`)
    }
  });
});
app.post('/nuevaCategoria', function (req, res) {
  if (req.body.id === '') {
    unaCategoria.create({ nombre: req.body.nombre }, function (error) {
      if (!error) {
        res.send(`Categoría "${req.body.nombre}" creada con éxito.`)
      }
      else {
        res.send(`Error al crear categoría.`)
      }
    })
  }
  else {
    unaCategoria.findByIdAndUpdate({ _id: req.body.idCategoria }, { nombre: req.body.nombre }, function (error) {
      if (!error) {
        res.send('Edición guardada con éxito')
      }
      else {
        res.send(`Error al guardar edición.`);
      }
    })
  }
});
app.get('/traerCategorias', function (req, res) {
    unaCategoria.find(function (err, result) {
      if (err) {
        res.send(err);
      } else {
        res.send(result);
      }
    });
});
app.post(`/eliminarCategoria`, function (req, res) {
  console.log(req.body);
  unaCategoria.deleteOne({ _id: req.body.id }, function (err) {
    if (!err) {
      res.send(`Categoría eliminada con éxito.`);
    } else {
      res.send("Error al eliminar Categoría.");
    }
  });
});
app.listen(puerto, function () {
  console.log(`Escuchando el puerto ${puerto}`)
});