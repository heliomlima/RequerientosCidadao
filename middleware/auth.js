// Este middleware será usado quando você implementar login
const authMiddleware = (req, res, next) => {
    // Por enquanto, usuário fixo
    req.user = {
        id: 1,
        nome: "Hélio Lima",
        email: "heliomlima@gmail.com"
    };
    next();
};

module.exports = authMiddleware;