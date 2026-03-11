"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyStatus = exports.TransactionType = exports.PropertyType = void 0;
var PropertyType;
(function (PropertyType) {
    PropertyType["ONE_ROOM"] = "ONE_ROOM";
    PropertyType["TWO_ROOM"] = "TWO_ROOM";
    PropertyType["THREE_ROOM"] = "THREE_ROOM";
    PropertyType["OFFICETEL"] = "OFFICETEL";
    PropertyType["APARTMENT"] = "APARTMENT";
    PropertyType["VILLA"] = "VILLA";
    PropertyType["COMMERCIAL"] = "COMMERCIAL";
})(PropertyType || (exports.PropertyType = PropertyType = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["MONTHLY"] = "MONTHLY";
    TransactionType["JEONSE"] = "JEONSE";
    TransactionType["SALE"] = "SALE";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var PropertyStatus;
(function (PropertyStatus) {
    PropertyStatus["AVAILABLE"] = "AVAILABLE";
    PropertyStatus["OCCUPIED"] = "OCCUPIED";
    PropertyStatus["CONTRACT_PENDING"] = "CONTRACT_PENDING";
    PropertyStatus["COMPLETED"] = "COMPLETED";
})(PropertyStatus || (exports.PropertyStatus = PropertyStatus = {}));
//# sourceMappingURL=property.js.map