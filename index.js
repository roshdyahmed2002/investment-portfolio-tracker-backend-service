require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const App = require('./app');

const datasource = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = new App(datasource)

app.expressApp.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});