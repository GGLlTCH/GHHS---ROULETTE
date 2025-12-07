// Конфигурация
const CONFIG = {
	redNumbers: [
		1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
	],
	dozens: {
		1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		2: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
		3: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
	},
}

// Глобальные переменные
let numberHistory = []
let numberStats = {}
let patterns = {}

// Инициализация
function init() {
	loadData()
	createTables()
	updateAll()
	setupEventListeners()
}

// Создание таблиц
function createTables() {
	createMainTable()
	createPredictionTable()
}

// Создание основной таблицы
function createMainTable() {
	const table = document.getElementById('mainTable')
	table.innerHTML = ''

	// Создаем сетку 3x12 в правильном порядке
	for (let row = 2; row >= 0; row--) {
		// 2, 1, 0 (снизу вверх)
		for (let col = 0; col < 12; col++) {
			const number = col * 3 + (3 - row)
			const cell = createTableCell(number, 'main')
			table.appendChild(cell)
		}
	}

	// Обновляем счетчики при создании таблицы
	updateMainTableCounts()
}

// Создание прогнозной таблицы
function createPredictionTable() {
	const table = document.getElementById('predictionTable')
	table.innerHTML = ''

	for (let row = 2; row >= 0; row--) {
		for (let col = 0; col < 12; col++) {
			const number = col * 3 + (3 - row)
			const cell = createTableCell(number, 'prediction')
			table.appendChild(cell)
		}
	}
}

// Создание ячейки
function createTableCell(number, type) {
	const cell = document.createElement('div')
	cell.className = `number-cell ${getNumberColor(number)}`
	cell.textContent = number
	cell.dataset.number = number

	if (type === 'main') {
		// Для основной таблицы
		const count = numberStats[number] || 0
		if (count > 0) {
			const dropCount = document.createElement('div')
			dropCount.className = 'drop-count'
			dropCount.textContent = count
			cell.appendChild(dropCount)
		}

		cell.addEventListener('click', () => addNumber(number))
	} else if (type === 'prediction') {
		// Для прогнозной таблицы
		cell.classList.add('prediction')
		updatePredictionCell(cell, number)
	}

	return cell
}

// Получение цвета числа
function getNumberColor(number) {
	if (number === '0' || number === '00') return 'green'
	return CONFIG.redNumbers.includes(parseInt(number)) ? 'red' : 'black'
}

// Добавление числа
function addNumber(number) {
	// Анимация
	animateNumber(number)

	// Добавление в историю
	numberHistory.push(number)
	numberStats[number] = (numberStats[number] || 0) + 1

	// Обновление паттернов
	updatePatterns(number)

	// Сохранение и обновление
	saveData()
	updateAll()

	return number
}

// Обновление счетчиков в основной таблице
function updateMainTableCounts() {
	// Обновляем ячейки с числами 1-36
	const numberCells = document.querySelectorAll('#mainTable .number-cell')
	numberCells.forEach(cell => {
		const number = parseInt(cell.dataset.number)
		const count = numberStats[number] || 0

		// Удаляем старый счетчик
		const oldCounter = cell.querySelector('.drop-count')
		if (oldCounter) {
			oldCounter.remove()
		}

		// Добавляем новый счетчик если есть выпадения
		if (count > 0) {
			const dropCount = document.createElement('div')
			dropCount.className = 'drop-count'
			dropCount.textContent = count
			cell.appendChild(dropCount)
		}
	})

	// Обновляем нули (0 и 00)
	const zeroCells = document.querySelectorAll(
		'.table-card:not(.prediction) .zero-cell'
	)
	zeroCells.forEach(cell => {
		const number = cell.dataset.number
		const count = numberStats[number] || 0

		const oldCounter = cell.querySelector('.drop-count')
		if (oldCounter) {
			oldCounter.remove()
		}

		if (count > 0) {
			const dropCount = document.createElement('div')
			dropCount.className = 'drop-count'
			dropCount.textContent = count
			cell.appendChild(dropCount)
		}
	})
}

// Анимация числа
function animateNumber(number) {
	const cells = document.querySelectorAll(`[data-number="${number}"]`)
	cells.forEach(cell => {
		cell.style.transform = 'scale(1.1)'
		setTimeout(() => {
			cell.style.transform = ''
		}, 300)
	})
}

// Обновление всего
function updateAll() {
	updateStatistics()
	updateHistory()
	updateHotNumbers()
	updatePredictions()
	updateAccuracy()
	updateMainTableCounts() // Добавляем обновление счетчиков
}

// Обновление статистики
function updateStatistics() {
	const total = numberHistory.length

	// Подсчет по цветам
	const redCount = numberHistory.filter(n =>
		CONFIG.redNumbers.includes(parseInt(n))
	).length
	const blackCount = numberHistory.filter(
		n => n !== 0 && n !== '00' && !CONFIG.redNumbers.includes(parseInt(n))
	).length

	// Подсчет по четности
	const evenCount = numberHistory.filter(
		n => n !== 0 && n !== '00' && n % 2 === 0
	).length
	const oddCount = numberHistory.filter(
		n => n !== 0 && n !== '00' && n % 2 === 1
	).length

	// Подсчет повторений
	let repeatCount = 0
	for (const count of Object.values(numberStats)) {
		if (count > 1) {
			repeatCount += count - 1
		}
	}

	// Обновление отображения
	document.getElementById('totalSpins').textContent = total
	document.getElementById('totalRepeats').textContent = repeatCount
	document.getElementById('redCount').textContent = redCount
	document.getElementById('blackCount').textContent = blackCount
	document.getElementById('evenCount').textContent = evenCount
	document.getElementById('oddCount').textContent = oddCount

	// Расчет процентов
	if (total > 0) {
		updatePercent('redPercent', redCount, total)
		updatePercent('blackPercent', blackCount, total)
		updatePercent('evenPercent', evenCount, total)
		updatePercent('oddPercent', oddCount, total)

		// Вероятности
		updateProbability('redProb', 'redProbBar', redCount, total)
		updateProbability('blackProb', 'blackProbBar', blackCount, total)
		updateProbability('evenProb', 'evenProbBar', evenCount, total)
		updateProbability('oddProb', 'oddProbBar', oddCount, total)

		// Дюжины
		const dozen1Count = numberHistory.filter(n =>
			CONFIG.dozens[1].includes(parseInt(n))
		).length
		const dozen2Count = numberHistory.filter(n =>
			CONFIG.dozens[2].includes(parseInt(n))
		).length
		const dozen3Count = numberHistory.filter(n =>
			CONFIG.dozens[3].includes(parseInt(n))
		).length

		updatePercent('sector1Prob', dozen1Count, total)
		updatePercent('sector2Prob', dozen2Count, total)
		updatePercent('sector3Prob', dozen3Count, total)

		// Низкие/высокие
		const lowCount = numberHistory.filter(n => n >= 1 && n <= 18).length
		const highCount = numberHistory.filter(n => n >= 19 && n <= 36).length

		updateProbability('lowProb', 'lowProbBar', lowCount, total)
		updateProbability('highProb', 'highProbBar', highCount, total)
	} else {
		// Сброс значений
		;[
			'redPercent',
			'blackPercent',
			'evenPercent',
			'oddPercent',
			'sector1Prob',
			'sector2Prob',
			'sector3Prob',
			'redProb',
			'blackProb',
			'evenProb',
			'oddProb',
			'lowProb',
			'highProb',
		].forEach(id => {
			const element = document.getElementById(id)
			if (element) element.textContent = '0%'
		})
		;[
			'redProbBar',
			'blackProbBar',
			'evenProbBar',
			'oddProbBar',
			'lowProbBar',
			'highProbBar',
		].forEach(id => {
			const bar = document.getElementById(id)
			if (bar) bar.style.width = '0%'
		})
	}
}

// Обновление процента
function updatePercent(elementId, count, total) {
	const element = document.getElementById(elementId)
	if (element) {
		const percent = ((count / total) * 100).toFixed(1)
		element.textContent = `${percent}%`
	}
}

// Обновление вероятности
function updateProbability(valueId, barId, count, total) {
	const valueElement = document.getElementById(valueId)
	const barElement = document.getElementById(barId)

	if (valueElement && barElement) {
		const percent = ((count / total) * 100).toFixed(1)
		valueElement.textContent = `${percent}%`
		barElement.style.width = `${percent}%`
	}
}

// Обновление истории
function updateHistory() {
	const container = document.getElementById('historyContainer')
	container.innerHTML = ''

	const recent = numberHistory.slice(-30).reverse()

	recent.forEach((number, index) => {
		const item = document.createElement('div')
		item.className = `history-item ${getNumberColor(number)}`
		item.textContent = number
		item.style.background =
			getNumberColor(number) === 'red'
				? 'linear-gradient(145deg, #d32f2f, #b71c1c)'
				: getNumberColor(number) === 'black'
				? 'linear-gradient(145deg, #111, #333)'
				: 'linear-gradient(145deg, #2e7d32, #1b5e20)'

		const originalIndex = numberHistory.length - 1 - index
		item.addEventListener('click', () => removeFromHistory(originalIndex))

		container.appendChild(item)
	})
}

// Обновление частых чисел
function updateHotNumbers() {
	const container = document.getElementById('hotNumbers')
	container.innerHTML = ''

	const hotNumbers = Object.entries(numberStats)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 6)

	hotNumbers.forEach(([number, count]) => {
		const element = document.createElement('div')
		element.className = 'hot-number'

		element.innerHTML = `
            <div class="number">${number}</div>
            <div class="count">${count} раз</div>
        `

		container.appendChild(element)
	})
}

// Обновление прогнозов
function updatePredictions() {
	const cells = document.querySelectorAll('#predictionTable .number-cell')
	cells.forEach(cell => {
		const number = parseInt(cell.dataset.number)
		updatePredictionCell(cell, number)
	})
}

// Обновление прогнозной ячейки
function updatePredictionCell(cell, number) {
	const total = numberHistory.length

	if (total === 0) {
		cell.classList.remove(
			'high-prediction',
			'medium-prediction',
			'low-prediction'
		)
		cell.style.opacity = '0.5'
		return
	}

	// Простая вероятность на основе частоты
	const frequency = numberStats[number] || 0
	const probability = (frequency / total) * 100

	// Очищаем предыдущие классы
	cell.classList.remove(
		'high-prediction',
		'medium-prediction',
		'low-prediction'
	)

	// Устанавливаем новый класс
	if (probability > 10) {
		cell.classList.add('high-prediction')
	} else if (probability > 5) {
		cell.classList.add('medium-prediction')
	} else if (probability > 0) {
		cell.classList.add('low-prediction')
	} else {
		cell.style.opacity = '0.4'
	}
}

// Обновление паттернов
function updatePatterns(newNumber) {
	if (numberHistory.length >= 4) {
		const lastThree = numberHistory.slice(-4, -1)
		const patternKey = lastThree.join('-')

		if (!patterns[patternKey]) {
			patterns[patternKey] = {}
		}

		patterns[patternKey][newNumber] = (patterns[patternKey][newNumber] || 0) + 1
		updatePatternsDisplay()
	}
}

// Отображение паттернов
function updatePatternsDisplay() {
	const container = document.getElementById('patternsContainer')
	container.innerHTML = ''

	const recentPatterns = Object.entries(patterns).slice(-5)

	recentPatterns.forEach(([pattern, data]) => {
		const element = document.createElement('div')
		element.className = 'pattern-item'

		// Находим наиболее частый исход
		let mostFrequent = ''
		let maxCount = 0

		for (const [outcome, count] of Object.entries(data)) {
			if (count > maxCount) {
				maxCount = count
				mostFrequent = outcome
			}
		}

		const total = Object.values(data).reduce((a, b) => a + b, 0)
		const probability = ((maxCount / total) * 100).toFixed(0)

		element.textContent = `${pattern} → ${mostFrequent} (${probability}%)`
		container.appendChild(element)
	})
}

// Обновление точности
function updateAccuracy() {
	const total = numberHistory.length

	if (total < 10) {
		document.getElementById('accuracyValue').textContent = '0%'
		document.getElementById('accuracyBar').style.width = '0%'
		return
	}

	// Простая оценка точности
	const recent = numberHistory.slice(-20)
	let correct = 0

	for (let i = 0; i < recent.length - 1; i++) {
		const predicted = predictNextNumber(recent.slice(0, i + 1))
		const actual = recent[i + 1]

		if (predicted.includes(actual)) {
			correct++
		}
	}

	const accuracy = (correct / (recent.length - 1)) * 100
	const accuracyValue = accuracy.toFixed(0)

	document.getElementById('accuracyValue').textContent = `${accuracyValue}%`
	document.getElementById('accuracyBar').style.width = `${accuracyValue}%`
}

// Прогноз следующего числа
function predictNextNumber(history) {
	if (history.length < 3) return []

	const lastThree = history.slice(-3)
	const patternKey = lastThree.join('-')

	if (patterns[patternKey]) {
		const outcomes = patterns[patternKey]
		return Object.entries(outcomes)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 3)
			.map(([num]) => parseInt(num))
	}

	return []
}

// Удаление из истории
function removeFromHistory(index) {
	if (index >= 0 && index < numberHistory.length) {
		const number = numberHistory[index]
		numberHistory.splice(index, 1)

		if (numberStats[number] > 1) {
			numberStats[number]--
		} else {
			delete numberStats[number]
		}

		saveData()
		updateAll()
	}
}

// Отмена последнего
function undoLast() {
	if (numberHistory.length > 0) {
		removeFromHistory(numberHistory.length - 1)
	}
}

// Очистка данных
function clearData() {
	if (confirm('Очистить все данные?')) {
		numberHistory = []
		numberStats = {}
		patterns = {}
		saveData()
		updateAll()
		createTables()
	}
}

// Экспорт данных
function exportData() {
	const data = {
		history: numberHistory,
		stats: numberStats,
		patterns: patterns,
		date: new Date().toISOString(),
	}

	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: 'application/json',
	})
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = `roulette-data-${Date.now()}.json`
	a.click()
	URL.revokeObjectURL(url)
}

// Импорт данных
function importData() {
	const input = document.createElement('input')
	input.type = 'file'
	input.accept = '.json'

	input.onchange = function (e) {
		const file = e.target.files[0]
		const reader = new FileReader()

		reader.onload = function (e) {
			try {
				const data = JSON.parse(e.target.result)
				numberHistory = data.history || []
				numberStats = data.stats || {}
				patterns = data.patterns || {}

				saveData()
				updateAll()
				createTables()

				alert('Данные успешно импортированы!')
			} catch (err) {
				alert('Ошибка при импорте данных')
			}
		}

		reader.readAsText(file)
	}

	input.click()
}

// Сохранение данных
function saveData() {
	const data = {
		history: numberHistory,
		stats: numberStats,
		patterns: patterns,
	}

	localStorage.setItem('rouletteData', JSON.stringify(data))
}

// Загрузка данных
function loadData() {
	const saved = localStorage.getItem('rouletteData')

	if (saved) {
		try {
			const data = JSON.parse(saved)
			numberHistory = data.history || []
			numberStats = data.stats || {}
			patterns = data.patterns || {}
			updateMainTableCounts() // Обновляем счетчики при загрузке
		} catch (err) {
			console.error('Ошибка загрузки данных:', err)
		}
	}
}

// Настройка обработчиков событий
function setupEventListeners() {
	// Управление
	document.getElementById('undoBtn').addEventListener('click', undoLast)
	document.getElementById('clearBtn').addEventListener('click', clearData)
	document.getElementById('exportBtn').addEventListener('click', exportData)
	document.getElementById('importBtn').addEventListener('click', importData)

	// Секторы
	document.querySelectorAll('.sector').forEach(sector => {
		sector.addEventListener('click', function () {
			const sectorNum = this.dataset.sector
			const numbers = CONFIG.dozens[sectorNum]

			// Подсветка чисел сектора
			document.querySelectorAll('.number-cell').forEach(cell => {
				const num = parseInt(cell.dataset.number)
				if (numbers.includes(num)) {
					cell.style.boxShadow = '0 0 10px gold'
					setTimeout(() => {
						cell.style.boxShadow = ''
					}, 1000)
				}
			})
		})
	})

	// Нули
	document.querySelectorAll('.zero-cell').forEach(cell => {
		cell.addEventListener('click', function () {
			addNumber(this.dataset.number)
		})
	})
}

// Инициализация
document.addEventListener('DOMContentLoaded', init)
