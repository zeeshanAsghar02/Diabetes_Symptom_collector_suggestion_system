import { Client, Account, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint(
    import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1',
  )
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '69ff4f99000eab7f4952');

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };
