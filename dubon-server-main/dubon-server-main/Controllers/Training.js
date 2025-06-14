import { models } from '../models/index.js';
const { Training, Participant } = models;

// Créer une nouvelle formation
const createTraining = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      duration,
      startDate,
      maxParticipants,
      location,
      category,
      level,
      prerequisites,
      objectives
    } = req.body;

    // Vérifier si l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    // Vérifier les fichiers
    if (!req.files || !req.files.image || !req.files.syllabus) {
      return res.status(400).json({
        success: false,
        message: "L'image et le syllabus sont requis"
      });
    }

    // Créer la formation avec les chemins des fichiers
    const training = await Training.create({
      title,
      description,
      price: parseFloat(price),
      duration,
      startDate,
      maxParticipants: parseInt(maxParticipants),
      location,
      category,
      level,
      prerequisites,
      objectives,
      image: req.files.image[0].path.replace(/\\/g, '/'),
      syllabus: req.files.syllabus[0].path.replace(/\\/g, '/'),
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: "Formation créée avec succès",
      data: training
    });
  } catch (error) {
    console.error("Erreur lors de la création de la formation:", error);
    
    // Gestion spécifique des erreurs de validation Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la formation",
      error: error.message
    });
  }
};

// Récupérer toutes les formations
const getAllTrainings = async (req, res) => {
  try {
    const trainings = await Training.findAll({
      attributes: [
        'id', 
        'title', 
        'description', 
        'startDate', 
        'duration',
        'price',
        'instructor', 
        'image',
        'syllabus'
      ]
    });
      

    res.status(200).json({
      success: true,
      data: trainings
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des formations:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des formations",
      error: error.message
    });
  }
};

// Récupérer une formation par ID
const getTrainingById = async (req, res) => {
  try {
    // Récupérer la formation par son ID
    const training = await Training.findByPk(req.params.id, {
      attributes: [
        'id',
        'title',
        'price',
        'description',
        'startDate',
        'duration',
        'instructor',
        'image',
        'syllabus'
      ]
    });

    // Vérifier si la formation existe
    if (!training) {
      return res.status(404).json({
        success: false,
        message: "Formation non trouvée"
      });
    }

    // Formatage des données (par exemple, transformer les chemins d'images en URLs complètes)
    // const formattedTraining = {
    //   ...training.toJSON(),
    //   image: training.image ? `${process.env.BASE_URL}/${training.image}` : null
    // };

    // Retourner la réponse avec les données formatées
    res.json({
      success: true,
      data: training
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la formation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la formation",
      error: error.message
    });
  }
};

// Mettre à jour une formation
const updateTraining = async (req, res) => {
  try {
    const [updated] = await Training.update(req.body, {
      where: { id: req.params.id }
    });

    if (updated) {
      const updatedTraining = await Training.findByPk(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Formation mise à jour avec succès",
        data: updatedTraining
      });
    }

    return res.status(404).json({
      success: false,
      message: "Formation non trouvée"
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la formation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la formation",
      error: error.message
    });
  }
};

// Supprimer une formation
const deleteTraining = async (req, res) => {
  try {
    const deleted = await Training.destroy({
      where: { id: req.params.id }
    });

    if (deleted) {
      return res.status(200).json({
        success: true,
        message: "Formation supprimée avec succès"
      });
    }

    return res.status(404).json({
      success: false,
      message: "Formation non trouvée"
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la formation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la formation",
      error: error.message
    });
  }
};

// Ajouter un participant à une formation
const addParticipant = async (req, res) => {
  try {
    console.log('Début de la fonction addParticipant');
    console.log('Données reçues:', {
      body: req.body,
      trainingId: req.params.trainingId,
      userId: req.user?.id
    });

    const { fullName, email, phone, address, message } = req.body;
    const trainingId = req.params.trainingId;
    const userId = req.user.id;
    
    // Vérifier si l'utilisateur est déjà inscrit d'abord
    const existingParticipant = await Participant.findOne({
      where: {
        trainingId,
        userId
      }
    });
    console.log('Vérification participant existant:', existingParticipant ? {
      id: existingParticipant.id,
      status: existingParticipant.status,
      paymentStatus: existingParticipant.paymentStatus
    } : 'Nouvelle inscription');

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: "Vous êtes déjà inscrit à cette formation",
        data: {
          status: existingParticipant.status,
          paymentStatus: existingParticipant.paymentStatus
        }
      });
    }

    const training = await Training.findByPk(trainingId);
    console.log('Formation trouvée:', training ? {
      id: training.id,
      title: training.title,
      participantsCount: training.participantsCount,
      maxParticipants: training.maxParticipants
    } : 'Formation non trouvée');
    
    if (!training) {
      return res.status(404).json({
        success: false,
        message: "Formation non trouvée"
      });
    }

    // Vérifier si la formation est complète
    console.log('Vérification du nombre de participants:', {
      actuel: training.participantsCount || 0,
      maximum: training.maxParticipants
    });

    if ((training.participantsCount || 0) >= training.maxParticipants) {
      console.log('Formation complète - Inscription refusée');
      return res.status(400).json({
        success: false,
        message: "Cette formation est complète"
      });
    }

    // Créer le participant
    console.log('Création du participant avec les données:', {
      trainingId,
      userId,
      fullName,
      email,
      phone,
      address
    });

    const participant = await Participant.create({
      trainingId,
      userId,
      fullName,
      email,
      phone,
      address,
      message,
      status: 'pending',
      paymentStatus: 'pending'
    });
    console.log('Participant créé:', participant.id);

    // Mettre à jour le nombre de participants
    console.log('Mise à jour du nombre de participants');
    const currentCount = training.participantsCount || 0;
    await training.update({
      participantsCount: currentCount + 1
    });
    console.log('Nombre de participants mis à jour:', currentCount + 1);

    console.log('Inscription réussie');
    res.status(200).json({
      success: true,
      message: "Inscription réussie",
      data: participant
    });
  } catch (error) {
    console.error("Erreur détaillée lors de l'inscription:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'inscription",
      error: error.message
    });
  }
};

const getMyTrainings = async (req, res) => {
  try {
    console.log('Fetching trainings for user:', req.user.id);
    
    const participants = await Participant.findAll({
      where: {
        userId: req.user.id
      },
      include: [{
        model: Training,
        as: 'training',
        required: true,
        attributes: [
          'id', 
          'title', 
          'description', 
          'startDate', 
          'duration', 
          'instructor', 
          'image'
        ]
      }],
      attributes: ['status', 'paymentStatus']
    });

    const trainings = participants.map(participant => ({
      ...participant.training.toJSON(),
      status: participant.status,
      paymentStatus: participant.paymentStatus
    }));

    console.log('Found trainings:', trainings.length);

    res.status(200).json({
      success: true,
      data: trainings
    });
  } catch (error) {
    console.error('Error fetching user trainings:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des formations"
    });
  }
};

// Récupérer les formations publiées par le formateur
const getMyPublishedTrainings = async (req, res) => {
  try {
    const trainings = await Training.findAll({
      where: {
        userId: req.user.id // Utilise l'ID de l'utilisateur connecté (formateur)
      },
      attributes: [
        'id',
        'title',
        'price',
        'startDate',
        'duration',
        'maxParticipants',
        'participantsCount',
        'status',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']] // Les plus récentes en premier
    });

    res.status(200).json({
      success: true,
      data: trainings
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des formations:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des formations",
      error: error.message
    });
  }
};

// Récupérer les participants d'une formation
const getTrainingParticipants = async (req, res) => {
  try {
    const participants = await Participant.findAll({
      where: {
        trainingId: req.params.id
      },
      attributes: [
        'id',
        'userId',
        'fullName',
        'email',
        'phone',
        'status',
        'paymentStatus',
        'paymentDate',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: participants
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des participants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des participants'
    });
  }
};

// Mettre à jour le statut d'un participant
const updateParticipantStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const participant = await Participant.findByPk(req.params.participantId);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant non trouvé'
      });
    }

    await participant.update({ status });

    // Mettre à jour le nombre de participants si nécessaire
    const training = await Training.findByPk(participant.trainingId);
    if (training) {
      const confirmedCount = await Participant.count({
        where: {
          trainingId: training.id,
          status: 'confirmed'
        }
      });
      await training.update({ participantsCount: confirmedCount });
    }

    res.status(200).json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: participant
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
};

// Mettre à jour le statut de paiement d'un participant
const updateParticipantPayment = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const participant = await Participant.findByPk(req.params.participantId);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant non trouvé'
      });
    }

    await participant.update({
      paymentStatus,
      paymentDate: paymentStatus === 'paid' ? new Date() : null
    });

    res.status(200).json({
      success: true,
      message: 'Statut de paiement mis à jour avec succès',
      data: participant
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut de paiement'
    });
  }
};

export default {
  createTraining,
  getAllTrainings,
  getTrainingById,
  updateTraining,
  addParticipant,
  deleteTraining,
  getMyTrainings,
  getMyPublishedTrainings,
  getTrainingParticipants,
  updateParticipantStatus,
  updateParticipantPayment
}