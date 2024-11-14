require('dotenv').config(); // To load .env variables
const express = require('express');
const mongoose = require('mongoose');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected...');
    // Test fetching documents from the 'items' collection in 'testDB'
    const testItems = await mongoose.connection.db.collection('items').find().toArray();
    console.log('Test items:', testItems);
  })
  .catch((err) => console.log('MongoDB connection error:', err));


const itemSchema = new mongoose.Schema({
    name:String,
    quantity:Number
});

const Item = mongoose.model('Item', itemSchema);
app.use(express.json());

app.get('/stock', async (req, res) => {
  try {
      const { name } = req.query;

      // If 'name' query parameter is provided, use it to filter results
      // Otherwise, return all items
      const query = name ? { name: new RegExp(name, 'i') } : {};

      // Find items based on the query (either filtered or all items)
      const items = await Item.find(query);

      // Return the found items as JSON
      res.json(items);
  } catch (err) {
      console.error(err); // Log the error for debugging
      res.status(500).json({ message: 'Failed to retrieve items from the database.' });
  }
});


app.post('/stockupdate' ,  async (req , res) => {
    try{
      const {name , quantity} = req.body;
      const newItem = new Item({name , quantity})
       await newItem.save()
      res.status(201).json(newItem);
    }catch(err){
      console.error(err)
      res.status(500).json({ message: 'Failed to add the item.' });
    }
})

app.post('/buy', async (req, res) => {
  try {
      // 1. Extract 'name' and 'quantity' from the request body
      const { name, quantity } = req.body;

      // 2. Validate input
      if (!name || !quantity) {
          return res.status(400).json({ message: 'Name and quantity are required.' });
      }

      // 3. Find the item by name
      const item = await Item.findOne({ name });

      // 4. Check if the item exists and if there is enough quantity to deduct
      if (!item) {
          return res.status(404).json({ message: 'Item not found.' });
      }

      if (item.quantity < quantity) {
          return res.status(400).json({ message: 'Insufficient quantity available.' });
      }

      // 5. Deduct the quantity
      item.quantity -= quantity;

      // 6. Save the updated item back to the database
      await item.save();

      // 7. Respond with the updated item
      res.json({
          message: `${quantity} of ${name} has been deducted.`,
          item: item
      });

  } catch (err) {
      console.error(err); // Log the error
      res.status(500).json({ message: 'Failed to process the purchase.' });
  }
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });