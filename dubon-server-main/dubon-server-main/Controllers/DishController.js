import { models } from '../models/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Créer le dossier pour les images des plats
const createUploadDir = () => {
  const dir = 'uploads/dishes';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

createUploadDir();

// Configuration de multer pour les plats
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/dishes');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont autorisées'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Ajouter un plat
export const addDish = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      preparationTime,
      ingredients,
      specialDiet,
      isSpicy,
      isVegetarian,
      isPromoted,
      promotionalPrice,
      restaurantId
    } = req.body;

    console.log('Données reçues:', req.body);
    console.log('Fichier reçu:', req.file);

    // Vérifier que le restaurant appartient au vendeur
    const restaurant = await models.Restaurant.findOne({
      where: { 
        id: restaurantId,
        sellerId: req.user.id
      }
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: 'Restaurant non trouvé ou non autorisé'
      });
    }

    const imageUrl = req.file ? req.file.path : null;

    const dish = await models.Dish.create({
      name,
      description,
      price: parseFloat(price),
      image: imageUrl,
      preparationTime: parseInt(preparationTime),
      ingredients,
      specialDiet: specialDiet ? JSON.parse(specialDiet) : [],
      isSpicy: isSpicy === 'true',
      isVegetarian: isVegetarian === 'true',
      isPromoted: isPromoted === 'true',
      promotionalPrice: promotionalPrice ? parseFloat(promotionalPrice) : null,
      restaurantId,
      isAvailable: true
    });

    console.log('Plat créé:', dish);

    res.status(201).json({
      success: true,
      data: dish
    });
  } catch (error) {
    console.error('Erreur ajout plat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du plat',
      error: error.message
    });
  }
};

// Obtenir les catégories de plats
export const getDishCategories = async (req, res) => {
  try {
    const categories = await models.DishCategory.findAll();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Erreur catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
};

// Obtenir les plats d'un restaurant
export const getRestaurantDishes = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const dishes = await models.Dish.findAll({
      where: { restaurantId },
      include: [{
        model: models.Restaurant,
        as: 'restaurant',
        attributes: ['name']
      }]
    });

    res.json({
      success: true,
      data: dishes
    });
  } catch (error) {
    console.error('Erreur plats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des plats',
      error: error.message
    });
  }
}; 