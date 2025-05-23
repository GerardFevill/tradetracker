/**
 * Utilitaire pour formater et valider les nombres
 */
export class NumberFormatter {
  /**
   * Convertit une chaîne en nombre valide
   * @param value La valeur à convertir
   * @returns Un nombre valide ou 0 si la conversion échoue
   */
  static parseNumber(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }
    
    // Nettoyer la chaîne pour s'assurer qu'elle ne contient qu'un seul point décimal
    // Remplacer les virgules par des points
    let cleanedValue = value.replace(/,/g, '.');
    
    // Si la chaîne contient plusieurs points, ne garder que le premier
    const parts = cleanedValue.split('.');
    if (parts.length > 2) {
      cleanedValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Convertir en nombre
    const result = parseFloat(cleanedValue);
    
    // Retourner 0 si la conversion échoue
    return isNaN(result) ? 0 : result;
  }
  
  /**
   * Formate un nombre pour l'affichage
   * @param value Le nombre à formater
   * @param decimals Le nombre de décimales à afficher
   * @returns Une chaîne formatée
   */
  static formatNumber(value: number | string, decimals: number = 2): string {
    const num = this.parseNumber(value);
    return num.toFixed(decimals);
  }
}
