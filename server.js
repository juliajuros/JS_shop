const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());

const dbURI = 'mongodb+srv://juliajuros00:8EWSyia4ATqnNa36@cluster0.le3qa.mongodb.net/PJS_simple_shop_database?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(dbURI)
  .then((result) => console.log('Connected to db'))
  .catch((err) => console.log(err));


const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  number: { type: Number, required: true },
});

const Product = mongoose.model('Product', productSchema);

app.get('/', (req, res) => {
  res.send('Welcome to our Shop');
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving products' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
      const updatedProduct = await Product.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true, runValidators: true }
      );
      if (!updatedProduct) {
          return res.status(404).json({ error: 'Product not found' });
      }
      res.json(updatedProduct);
  } catch (err) {
      res.status(400).json({ error: 'Error updating product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
      const deletedProduct = await Product.findByIdAndDelete(req.params.id);
      if (!deletedProduct) {
          return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product deleted successfully' });
  } catch (err) {
      res.status(500).json({ error: 'Error deleting product' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, category, number } = req.body;
    const newProduct = new Product({ name, price, category, number });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(400).json({ error: 'Error' });
  }
});

app.post('/api/products/update-stock', async (req, res) => {
  try {
    const updates = req.body.updates;

    for (const update of updates) {
      const product = await Product.findById(update.id);

      if (!product) {
        return res.status(404).json({ error: `Product with ID ${update.id} not found` });
      }

      if (product.number < update.quantity) {
        return res.status(400).json({ error: `Not enough stock for product: ${product.name}` });
      }

      product.number -= update.quantity;
      await product.save();
    }

    res.status(200).json({ message: 'Stock updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating stock' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving categories' });
  }
});

app.get('/api/products/search', async (req, res) => {
  console.log('Received search query:', req.query.q);
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Please provide a search query.' });
    }

    const products = await Product.find({ name: new RegExp(q, 'i') });

    if (!Array.isArray(products)) {
      return res.status(500).json({ error: 'Products is not an array' });
    }

    res.json(products);
  } catch (err) {
    console.error('Error searching products:', err);
    console.error(req.query);
    res.status(500).json({ error: 'Error searching products' });
  }
});

const PORT = 5000;
app.listen(
  PORT,
  () => console.log(`Server is working: http://localhost:${PORT}`)
)