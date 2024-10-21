const mongoose = require('mongoose');
const Client = require('../clientDetails');

exports.searchClient = async (req, res) => {
    const { search } = req.query;
    const searchTerms = search.trim().split(/\s+/);
  
    try {
      const clients = await Client.find(
        {
          $or: [
            { phoneNumber: search },
            { email: new RegExp(search, 'i') },
            {
              $and: searchTerms.map(term => ({
                $or: [
                  { firstname: new RegExp(term, 'i') },
                  { lastname: new RegExp(term, 'i') }
                ]
              }))
            }
          ]
        },
        '_id firstname lastname email phoneNumber' // Specify fields to return
      );
  
      if (clients.length === 0) {
        return res.status(404).json({ message: 'No clients found.' });
      }
  
      // Create an array of clients with concatenated firstName and lastName
      const result = clients.map(client => ({
        id: client._id,
        firstName: client.firstname,
        lastName: client.lastname,
        email: client.email,
        phoneNumber: client.phoneNumber,
        fullName: `${client.firstname} ${client.lastname}`
      }));
  
      // Send the response with all matched clients
      res.json(result);
    } catch (err) {
      // Catch error and send a 500 response with the error message
      console.error('Error searching for clients:', err);
      res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
  };