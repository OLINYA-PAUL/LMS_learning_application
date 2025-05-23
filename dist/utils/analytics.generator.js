"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLast12MonthData = void 0;
[];
const generateLast12MonthData = async (model) => {
    const last12Months = [];
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    for (let i = 11; i >= 0; i--) {
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i * 28);
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 28);
        const monthYear = endDate.toLocaleString("default", {
            day: "numeric",
            month: "short",
            year: "2-digit",
        });
        const count = await model.countDocuments({
            createdAt: {
                $gte: startDate,
                $lt: endDate,
            },
        });
        last12Months.push({ month: monthYear, count });
    }
    return { last12Months };
};
exports.generateLast12MonthData = generateLast12MonthData;
