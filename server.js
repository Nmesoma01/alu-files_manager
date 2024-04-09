const express = require('express');

const app = express();
const port = process.env.PORT || 5000;
const routes = require('./routes/index');

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: false, limit: '20mb' }));

app.use('/', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
