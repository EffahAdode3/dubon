import RestaurantItem from "../models/RestaurantItem.js";
import { models } from "../models/index.js";
const { Restaurant } = models;

// Créer un nouvel article du restaurant
const createRestaurantItem = async (req, res) => {
  try {
    const newItem = new RestaurantItem(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error("Erreur lors de la création de l'article :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Récupérer tous les articles du restaurant
const getAllRestaurantItems = async (req, res) => {
  try {
    const items = await RestaurantItem.find();
    res.status(200).json(items);
  } catch (error) {
    console.error("Erreur lors de la récupération des articles :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Récupérer un article par ID
const getRestaurantItemById = async (req, res) => {
  try {
    const item = await RestaurantItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Article non trouvé." });
    }
    res.status(200).json(item);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'article :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Mettre à jour un article du restaurant
const updateRestaurantItem = async (req, res) => {
  try {
    const updatedItem = await RestaurantItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ message: "Article non trouvé." });
    }
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'article :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Supprimer un article du restaurant
const deleteRestaurantItem = async (req, res) => {
  try {
    const deletedItem = await RestaurantItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: "Article non trouvé." });
    }
    res.status(200).json({ message: "Article supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

const addRestaurant = async (req, res) => {
  try {
    console.log('User:', req.user);
    console.log('Données reçues:', req.body);
    console.log('Fichiers reçus:', req.files);

    const {
      name,
      description,
      address,
      city,
      phoneNumber,
      email,
      location
    } = req.body;

    // Validation des champs requis
    if (!name || !description || !address || !city || !phoneNumber) {
      console.log('Validation échouée:', {
        name: !!name,
        description: !!description,
        address: !!address,
        city: !!city,
        phoneNumber: !!phoneNumber
      });
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs obligatoires',
        missingFields: {
          name: !name,
          description: !description,
          address: !address,
          city: !city,
          phoneNumber: !phoneNumber
        }
      });
    }

    if (!req.user?.id) {
      console.log('ID du vendeur manquant');
      return res.status(400).json({
        success: false,
        message: 'ID du vendeur manquant'
      });
    }

    // Vérifier les fichiers uploadés
    const logo = req.files?.logo?.[0]?.path;
    const coverImage = req.files?.coverImage?.[0]?.path;

    console.log('Logo path:', logo);
    console.log('Cover image path:', coverImage);

    const restaurantData = {
      name,
      description,
      address,
      city,
      phoneNumber,
      email: email || null,
      logo: logo || null,
      coverImage: coverImage || null,
      location: location || null,
      sellerId: req.user.id,
      status: 'pending'
    };

    console.log('Données du restaurant à créer:', restaurantData);

    // Créer le restaurant
    const restaurant = await models.Restaurant.create(restaurantData);

    console.log('Restaurant créé:', restaurant);

    res.status(201).json({
      success: true,
      message: 'Restaurant créé avec succès',
      restaurantId: restaurant.id,
      restaurant: restaurant
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la création du restaurant:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du restaurant',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export default {createRestaurantItem,deleteRestaurantItem,updateRestaurantItem,getRestaurantItemById,getAllRestaurantItems,addRestaurant}