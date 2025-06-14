import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import bodyParser from "body-parser";
import express from "express";
import http from 'http';
import Order from './Routers/Order.js'
import User from './Routers/User.js'
import errorHandler from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";
import Products from './Routers/Products.js'
import morgan from "morgan";
import cors from 'cors';
import Service from './Routers/Service.js'
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import cartRoute from './Routers/cartRoute.js';
// import chat from './Routers/chat.js';
import Training from './Routers/Training.js'
import searchRouter from './Routers/searchRouter.js'
import category from './Routers/category.js'
import Seller from "./Routers/Seller.js"
import Event from './Routers/Event.js'
import paymentRoutes from './Routers/paymentRoute.js';
import { sequelize, models, syncModels } from './models/index.js';
import pg from 'pg';
// import { initializeDatabase } from './config/dbConfig.js';
import Admin from './Routers/Admin.js';
import { logError } from './utils/systemLogger.js';
import systemRoutes from './Routers/system.js';
import themeRoutes from './Routers/themes.js';
import disputeRoutes from './Routers/disputes.js';
import wishlistRoute from './Routers/wishlist.js';
import analyticsRouter from './Routers/analytics.js';
import systemRouter from './Routers/system.js';
import restaurantRoutes from './Routers/Restaurant.js';
import eventRoutes from './Routers/Event.js';
import notificationsRouter from './Routers/NotificationsRouter.js';
// import dishesRoutes from './routes/seller/dishes';
import shopRoutes from './Routers/Shop.js';

import subscriptionRoutes from './Routers/subscription.js';


// Charger les variables d'environnement
dotenv.config();

// Log pour debug
console.log('Variables d\'environnement chargées:', {
  EMAIL: process.env.EMAIL ? 'Défini' : 'Non défini',
  PASSWORD: process.env.PASSWORD ? 'Défini' : 'Non défini',
  NODE_ENV: process.env.NODE_ENV
});

// Initialize dotenv with absolute path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Express
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialiser le store de session PostgreSQL d'abord
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

const SessionStore = pgSession(session);
const sessionStore = new SessionStore({
  pool,
  createTableIfMissing: true
});

// Vérifier que JWT_SECRET est défini
const JWT_SECRET = process.env.JWT_SECRET || 'anotherstrategickey';
console.log('Using JWT_SECRET:', JWT_SECRET ? 'Defined' : 'Not defined');

// Configurations principales
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(cors({
  origin: ['https://dubonservice.com', 'http://localhost:3000', 'https://dubon-service.onrender.com', 'https://dubon-service.vercel.app', 'https://www.dubonservice.com'],
  credentials: true
}));

// Configuration de la session APRÈS avoir initialisé sessionStore
app.use(session({
  store: sessionStore,
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Désactiver le timeout du serveur pour les uploads longs
server.timeout = 300000; // 5 minutes

// Définir les paramètres système par défaut
const defaultSystemSettings = {
  key: 'general_settings',
  value: {
    general: {
      siteName: 'Dubon',
      siteDescription: 'Plateforme de commerce en ligne',
      contactEmail: 'contact@dubon.com',
      phoneNumber: '',
      address: ''
    },
    features: {
      enableRegistration: true,
      enableReviews: true,
      enableChat: true,
      maintenanceMode: false
    },
    email: {
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpUser: process.env.SMTP_USER || '',
      smtpPassword: process.env.SMTP_PASSWORD || '',
      senderEmail: process.env.SENDER_EMAIL || 'noreply@dubon.com',
      senderName: 'Dubon'
    },
    social: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    }
  },
  category: 'general',
  description: 'Paramètres généraux du système',
  dataType: 'json',
  isPublic: false
};

// Fonction pour vérifier et rétablir la connexion
const checkDatabaseConnection = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✓ Connexion à la base de données OK');
      return true;
    } catch (error) {
      console.error(`Tentative ${i + 1}/${retries} échouée:`, error.message);
      if (i < retries - 1) {
        console.log('Nouvelle tentative dans 5 secondes...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  return false;
};

// Routes publiques
app.get("/", (req, res) => {
    res.json("Hello")
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes publiques de l'API
app.use('/api/shops', shopRoutes);
app.use('/api/search', searchRouter);
app.use('/api/category', category);
app.use('/api/products', Products);
app.use('/api/user', User);
// app.use('/api/chat', chat);
// Routes protégées (déjà authentifiées dans leurs fichiers respectifs)
app.use('/api/services', Service);
app.use('/api/orders', Order);
app.use("/api/training", Training);
app.use("/api", Event);
app.use("/api/", cartRoute);
app.use('/api/wishlist', wishlistRoute);
app.use('/api/payment', paymentRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/events', eventRoutes);

// Routes admin
app.use('/api/admin', Admin);
app.use('/api/admin/themes', themeRoutes);
app.use('/api/admin/system', systemRoutes);
app.use('/api/admin/analytics', analyticsRouter);

// Routes vendeur
app.use('/api/seller', Seller);

// Autres routes protégées
app.use('/api/disputes', disputeRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Error handling middlewares
app.use(errorHandler.notFound);
app.use(errorHandler.errorHandler);
app.use((error, req, res, next) => {
  logError(error, req);
  res.status(500).json({
    success: false,
    message: "Une erreur est survenue",
    error: process.env.NODE_ENV === 'production' ? error.message : undefined
  });
});

// Fonction pour configurer les dossiers d'upload


const startServer = async () => {
  try {
    // Vérifier la connexion
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Impossible de se connecter à la base de données');
    }

    // Activer l'extension UUID
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('✅ Extension UUID activée avec succès');

    // Synchroniser les modèles avec la base de données
    // console.log('🔄 Synchronisation des modèles...');
    
    // // Vérifier si la table OrderItems existe
    // const tableExists = await sequelize.queryInterface.showAllTables()
    //   .then(tables => tables.includes('OrderItems'));
    
    // if (!tableExists) {
    //   console.log('🔄 Création de la table OrderItems...');
    //   await models.OrderItem.sync();
    //   console.log('✅ Table OrderItems créée avec succès');
    // } else {
    //   console.log('🔄 Synchronisation du modèle OrderItem...');
    //   await models.OrderItem.sync({ alter: true });
    //   console.log('✅ Modèle OrderItem synchronisé avec succès');
    // }

    // // Synchroniser les autres modèles normalement
    // const syncOptions = {
    //   force: false,
    //   alter: true
    // };
    
    // await sequelize.sync(syncOptions);
    // console.log('✅ Tous les modèles synchronisés avec succès');

    // Vérifier les données par défaut
    await initializeDefaultData();

    // Démarrer le serveur
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`✓ Serveur démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage du serveur:', error);
    throw error;
  }
};

// Fonction pour initialiser les données par défaut
const initializeDefaultData = async () => {
  try {
    console.log('📝 Vérification des données par défaut...');
    
    // Vérifier les plans d'abonnement
    console.log('💎 Vérification des plans d\'abonnement...');
    const plansCount = await models.Plan.count();
    if (plansCount === 0) {
      console.log('💎 Création des plans d\'abonnement par défaut...');
      const defaultPlans = [
        {
          id: 'b0c3f5d7-eb4c-4c1f-9137-c8f5d1e9a1a1',
          name: 'Basic',
          price: 5000,
          monthlyPrice: 5000,
          yearlyPrice: 54000,
          duration: 30,
          status: 'active',
          currency: 'XOF',
          description: 'Plan de base pour démarrer votre activité',
          features: {
            productsLimit: 50,
            storageLimit: 500,
            supportLevel: 'basic',
            benefits: [
              'Jusqu\'à 50 produits',
              'Support par email',
              'Statistiques de base',
              'Paiements sécurisés'
            ]
          }
        },
        {
          id: 'c1d4e6f8-fc5d-4e2f-a248-d9f6e2b3c4a2',
          name: 'Standard',
          price: 15000,
          monthlyPrice: 15000,
          yearlyPrice: 162000,
          duration: 30,
          status: 'active',
          currency: 'XOF',
          description: 'Plan idéal pour les entreprises en croissance',
          features: {
            productsLimit: 200,
            storageLimit: 2000,
            supportLevel: 'priority',
            benefits: [
              'Jusqu\'à 200 produits',
              'Support prioritaire',
              'Statistiques avancées',
              'Outils marketing de base',
              'Gestion des promotions'
            ]
          }
        },
        {
          id: 'd2e5f7g9-gd6e-5f3g-b359-e0g7f3c4b5a3',
          name: 'Premium',
          price: 30000,
          monthlyPrice: 30000,
          yearlyPrice: 324000,
          duration: 30,
          status: 'active',
          currency: 'XOF',
          description: 'Solution complète pour les entreprises établies',
          features: {
            productsLimit: -1,
            storageLimit: 10000,
            supportLevel: 'premium',
            benefits: [
              'Produits illimités',
              'Support premium 24/7',
              'Statistiques en temps réel',
              'Outils marketing avancés',
              'API personnalisée',
              'Dashboard personnalisé'
            ]
          }
        }
      ];
      await models.Plan.bulkCreate(defaultPlans);
      console.log('✅ Plans d\'abonnement créés avec succès');
    } else {
      console.log('✅ Plans d\'abonnement existants');
    }

    // Vérifier les paramètres système
    const existingSettings = await models.SystemSetting.findOne({
      where: { key: 'general_settings' }
    });

    if (!existingSettings) {
      console.log('⚙️ Configuration des paramètres système par défaut...');
      await models.SystemSetting.create(defaultSystemSettings);
      console.log('✅ Paramètres système initialisés');
    } else {
      console.log('✅ Paramètres système existants');
    }

    // Vérifier les catégories


    console.log('✅ Vérification des données terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des données:', error);
    // En production, on ne veut pas que l'erreur arrête le serveur
    console.error(error);
  }
};

startServer().catch(error => {
  console.error('Erreur fatale au démarrage:', error);
  process.exit(1);
});