import re


def parse_parameters_from_doc(doc_string):
    """
    Parses sklearn-style documentation to extract parameter information.

    Returns a list of dictionaries with parameter details.
    """

    params_match = re.search(r'Parameters\s*\n-{2,}\n(.*?)(?=\n[A-Z][a-z]+\s*\n-{2,}|\nSee Also|\nNotes|\nReferences|\nExamples|\Z)',
                             doc_string, re.DOTALL)

    if not params_match:
        return []

    params_section = params_match.group(1)

    param_blocks = re.split(r'\n(?=\w+\s*:)', params_section.strip())

    parameters = []

    for block in param_blocks:
        if not block.strip():
            continue

        lines = block.strip().split('\n')
        header = lines[0].strip()

        name_match = re.match(r'(\w+)\s*:', header)
        if not name_match:
            continue

        param_name = name_match.group(1)

        type_default_part = header[len(param_name):].strip()[1:].strip()

        if ', default=' in type_default_part:
            type_part, default_part = type_default_part.split(', default=', 1)
            if default_part == "None":
                default_part = None
        else:
            type_part = type_default_part
            default_part = None

        description_lines = []
        for line in lines[1:]:
            if line.strip():
                clean_line = re.sub(r'^    ', '', line)
                description_lines.append(clean_line)
            else:
                description_lines.append('')

        description = '\n'.join(description_lines).strip()

        param_type, options = parse_type_info(type_part.strip())

        clean_default = default_part.strip().strip(
            '"\'') if default_part is not None else None

        param_dict = {
            'name': param_name,
            'type': param_type,
            'default': clean_default,
            'doc': description.replace("\n", " ")
        }

        if options:
            param_dict['options'] = options

        parameters.append(param_dict)

    return parameters


def parse_type_info(type_str):
    """
    Parse type information and return (type, options) tuple.
    """
    options_match = re.search(r'\{([^}]+)\}', type_str)
    if options_match:
        options_str = options_match.group(1)
        options = [opt.strip().strip('"\'') for opt in options_str.split(',')]
        return 'select', options

    if re.search(r'\bint\b.*\bfloat\b|\bfloat\b.*\bint\b', type_str, re.IGNORECASE):
        return 'number', None

    if ' or ' in type_str:
        return 'any', None

    type_str_lower = type_str.lower()
    if 'int' in type_str_lower:
        return 'int', None
    elif 'float' in type_str_lower:
        return 'float', None
    elif 'str' in type_str_lower:
        return 'string', None
    elif 'bool' in type_str_lower:
        return 'boolean', None
    elif 'array' in type_str_lower or 'ndarray' in type_str_lower:
        return 'array', None
    elif 'dict' in type_str_lower:
        return 'dict', None
    elif 'list' in type_str_lower:
        return 'list', None
    else:
        return 'any', None
