# MongoDB Atlas Setup Guide

This guide will help you set up MongoDB Atlas for your teaching platform application.

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. Sign up for a free account
3. Create a new cluster (choose the free tier "M0" which is suitable for development)

## Step 2: Configure Database Access

1. Navigate to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a database user with a strong password
4. Assign the "Read and Write to any database" role (or customize as needed)

## Step 3: Configure Network Access

1. Navigate to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development, you can add "0.0.0.0/0" to allow connections from anywhere (NOT recommended for production)
4. For production, add specific IP addresses that will connect to your database

## Step 4: Get Connection String

1. Go to "Clusters" and click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Node.js" and version 4.0 or later
4. Copy the connection string

## Step 5: Update Environment Variables

Replace the `MONGODB_URI` in your `.env` file with the connection string from MongoDB Atlas:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority
```

Replace `<username>`, `<password>`, `<cluster-name>`, and `<database-name>` with your actual values.

Example:
```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abcd123.mongodb.net/teaching-platform?retryWrites=true&w=majority
```

## Step 6: Update Package Dependencies

Make sure you have the correct MongoDB driver version in your `package.json`:

```json
{
  "dependencies": {
    "mongoose": "^7.0.0" // or latest version
  }
}
```

## Step 7: Security Best Practices

### For Production:
1. Use environment variables to store sensitive information
2. Restrict network access to specific IP addresses
3. Use strong passwords for database users
4. Enable encryption at rest
5. Regularly rotate database credentials

### Environment Variables (.env):
```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority
JWT_SECRET=your_secure_jwt_secret_key
NODE_ENV=production
```

## Step 8: Testing the Connection

After updating your environment variables:

1. Make sure to restart your application
2. Monitor the console for successful connection messages
3. Test database operations (creating, reading, updating, deleting records)

## Troubleshooting Common Issues

### Connection Timeout:
- Verify network access settings in MongoDB Atlas
- Check firewall settings on your local machine/server

### Authentication Failed:
- Verify username and password in the connection string
- Ensure the database user has proper permissions

### Invalid Connection String:
- Double-check the format of the connection string
- Make sure special characters in the password are properly encoded

## Migration from Local MongoDB to Atlas

If you have existing data in your local MongoDB that you want to migrate:

1. Export your local data:
```bash
# Export all collections
mongodump --uri="mongodb://localhost:27017/teaching-platform"
```

2. Import to MongoDB Atlas:
```bash
mongorestore --uri="mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>" dump/
```

## Production Deployment Notes

- Always use HTTPS in production
- Implement proper error handling for database connection failures
- Set up monitoring for database performance
- Plan for backup and recovery procedures