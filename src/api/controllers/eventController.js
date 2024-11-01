const Evento = require("../models/eventModel");
const User = require("../models/userModel");

//! REGISTRAR ASISTENCIA
const addAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Buscar el evento por ID
    const event = await Evento.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    // Verificar si el usuario ya está registrado
    if (event.attendees.includes(req.user._id)) {
      return res.status(400).json({ error: "Ya estás registrado en este evento" });
    }

    // Agregar el usuario al evento
    event.attendees.push(req.user._id);
    await event.save();

    // Agregar el evento al usuario
    const user = await User.findById(req.user._id);
    user.events.push(eventId);
    await user.save();

    return res.status(200).json({ message: "Registrado al evento exitosamente" });
  } catch (error) {
    console.error("Error al registrarse al evento:", error);
    return res.status(500).json({ error: "Error al registrarse al evento" });
  }
};

//! ELIMINARSE DE UNA ASISTENCIA
const removeAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Buscar el evento por ID
    const event = await Evento.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    // Verificar si el usuario está registrado en el evento
    if (!event.attendees.includes(req.user._id)) {
      return res.status(400).json({ error: "No estás registrado en este evento" });
    }

    // Eliminar al usuario de la lista de asistentes
    event.attendees = event.attendees.filter(
      (attendee) => attendee.toString() !== req.user._id.toString()
    );
    await event.save();

    // Eliminar el evento de la lista de eventos del usuario
    const user = await User.findById(req.user._id);
    user.events = user.events.filter(
      (userEvent) => userEvent.toString() !== eventId
    );
    await user.save();

    return res.status(200).json({ message: "Asistencia eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar asistencia:", error);
    return res.status(500).json({ error: "Error al eliminar asistencia" });
  }
};

//! CREAR UN EVENTO
const createEvent = async (req, res) => {
  try {
    const { title, img, description, location, date } = req.body;

    // Validación del formato de la fecha
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime()) || eventDate < new Date()) {
      return res.status(400).json({ error: "Fecha inválida o en el pasado" });
    }

    const newEvent = new Evento({
      title,
      img,
      description,
      location,
      date: eventDate,
      organizer: req.user._id,
    });

    const event = await newEvent.save();
    return res.status(201).json(event);
  } catch (error) {
    console.error("Error al crear el evento:", error);
    return res.status(400).json({ error: "Error al crear evento" });
  }
};

//! LISTAR TODOS LOS EVENTOS
const getEvents = async (req, res) => {
  try {
    const events = await Evento.find()
      .populate("organizer", "username") // Popular el organizador con su nombre de usuario
      .populate("attendees", "username"); // Popular los asistentes con su nombre de usuario

    return res.status(200).json(events);
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    return res.status(400).json({ error: "Error al obtener eventos" });
  }
};

//! ELIMINAR EVENTO CREADO (SÓLO ORGANIZADOR)
const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Evento.findById(eventId);

    if (!event) return res.status(404).json({ error: "Evento no encontrado" });

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "No autorizado para eliminar este evento" });
    }

    await Evento.findByIdAndDelete(eventId);
    return res.status(200).json({ message: "Evento eliminado" });
  } catch (error) {
    return res.status(400).json({ error: "Error al eliminar evento" });
  }
};

//! VER ASISTENTES A EVENTO (SÓLO ORGANIZADOR)
const getAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Evento.findById(eventId).populate("attendees", "username");

    if (!event) return res.status(404).json({ error: "Evento no encontrado" });

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "No autorizado para ver los asistentes" });
    }

    return res.status(200).json(event.attendees);
  } catch (error) {
    return res.status(400).json({ error: "Error al obtener asistentes" });
  }
};

//! LISTAR TODOS LOS EVENTOS QUE HAS REGISTRADO ASISTENCIA
const getAttendingEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("events", "title location description");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.status(200).json(user.events);
  } catch (error) {
    return res.status(400).json({ error: "Error al obtener los eventos" });
  }
};

module.exports = {
  createEvent,
  getEvents,
  addAttendance,
  removeAttendance,
  deleteEvent,
  getAttendees,
  getAttendingEvents
};